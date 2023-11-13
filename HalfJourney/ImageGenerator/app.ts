import { DynamoDBClient, UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { generate } from './lib/generateImage';

export async function handler(event: DynamoDBStreamEvent) {
    try {
        const record = event.Records[0].dynamodb?.NewImage;
        const type = event.Records[0].eventName;
        console.log({ type, record });

        if (type !== "INSERT") {
            return {
                statusCode: 200,
                body: JSON.stringify("ignore"),
            };
        }

        const UserId = record?.UserId?.S || "";
        const PromptId = record?.PromptId?.S || "";
        const prompt = record?.prompt?.S || "";
        const interactionId = record?.InteractionId?.S || "";
        const interactionToken = record?.InteractionToken?.S || "";
        console.log({ UserId, PromptId, prompt, interactionId, interactionToken });

        const key = await generate(UserId, PromptId, prompt, interactionId, interactionToken);

        // Update database with key
        const params: UpdateItemCommandInput = {
            TableName: process.env.TABLENAME || "",
            Key: {
                "UserId": {
                    S: UserId
                },
                "PromptId": {
                    S: PromptId
                }
            },
            UpdateExpression: "set #key = :key",
            ExpressionAttributeNames: {
                "#key": "Key"
            },
            ExpressionAttributeValues: {
                ":key": {
                    S: key
                }
            }
        };

        const client = new DynamoDBClient();
        const data = await client.send(new UpdateItemCommand(params));
        console.log(data);

        return {
            statusCode: 200,
            body: JSON.stringify("ok"),
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
