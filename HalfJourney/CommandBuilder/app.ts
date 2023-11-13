import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { APIApplicationCommand } from 'discord-api-types/payloads/v10/interactions';

const DISCORD_API_URL = `https://discord.com/api/v10/applications/${process.env.APP_ID}/commands`;
const HEADERS = {
    'Authorization': `Bot ${process.env.BOT_TOKEN}`,
    'Content-Type': 'application/json',
};

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

        const body: APIApplicationCommand = JSON.parse(event.body);

        const response = await fetch(DISCORD_API_URL, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            // Handle the case where the response is not OK
            console.error(`Discord API request failed with status ${response.status}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    message: 'Discord API request failed',
                }),
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify({
                data,
            }),
        };
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
