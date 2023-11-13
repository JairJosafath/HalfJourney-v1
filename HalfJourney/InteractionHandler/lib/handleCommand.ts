import { APIChatInputApplicationCommandInteraction as interaction, APIInteractionDataOptionBase } from "discord-api-types/payloads/v10/interactions";
import { imagine } from "./imagine";

export async function handleCommand(discordEvent: interaction) {
    // command name
    const name = discordEvent.data.name;

    // command options we only have prompt for now
    // not sure about the typing here so I just used any
    const prompt: string = (discordEvent.data?.options?.[0] as APIInteractionDataOptionBase<any, any>).value;
    const user = discordEvent.member?.user;
    const interactionId = discordEvent.id;
    const interactionToken = discordEvent.token;

    switch (name) {
        case "imagine":
            return imagine(prompt, user, interactionId, interactionToken);
        default:
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'no command',
                }),
            };
    }
}