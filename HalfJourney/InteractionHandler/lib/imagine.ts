import { APIUser } from "discord-api-types/v10";
import { PutItemCommand, PutItemCommandInput, PutItemCommandOutput, DynamoDBClient } from "@aws-sdk/client-dynamodb";

const TABLENAME = process.env.TABLENAME || "";
const client = new DynamoDBClient();

export async function imagine(prompt: string, user: APIUser | undefined, interactionId: string, interactionToken: string) {
    // Store prompt in the database
    const params: PutItemCommandInput = {
        TableName: TABLENAME,
        Item: {
            "prompt": { S: prompt },
            "UserId": { S: user?.id || "unknown" },
            "UserName": { S: user?.username || "unknown" },
            "Favorite": { BOOL: false },
            "PromptId": { S: `${user?.id || "unknown"}-${Date.now()}` },
            "CreatedAt": { S: new Date().toISOString() },
            "InteractionId": { S: interactionId },
            "InteractionToken": { S: interactionToken },
        }
    };

    try {
        const data: PutItemCommandOutput = await client.send(new PutItemCommand(params));
        if (data.$metadata.httpStatusCode !== 200) {
            throw new Error(`Error saving prompt to the database ${data.$metadata.httpStatusCode}`);
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

    // Send a message to the channel
    const content = "Your image is being generated. Please wait a moment.";

    return {
        statusCode: 200,
        body: JSON.stringify({
            type: 4,
            data: {
                content
            }
        }),
    };
}
