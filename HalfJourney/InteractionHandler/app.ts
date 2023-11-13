import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    APIInteraction,
    APIChatInputApplicationCommandInteraction,
} from 'discord-api-types/payloads/v10/interactions';
import { verify } from './lib/verify';
import { handleCommand } from './lib/handleCommand';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'No body',
                }),
            };
        }

        const discordEvent: APIInteraction = JSON.parse(event.body);
        const type = discordEvent.type;

        switch (type) {
            case 1:
                // Type 1 is for PING, used for endpoint verification by Discord
                return verify(event);
            case 2:
                // Slash command
                return handleCommand(discordEvent as APIChatInputApplicationCommandInteraction);
            default:
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: 'Not a valid type',
                    }),
                };
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Some error happened',
            }),
        };
    }
}
