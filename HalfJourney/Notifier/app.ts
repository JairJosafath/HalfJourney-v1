import { GetObjectCommand, GetObjectCommandInput, S3Client } from "@aws-sdk/client-s3";
import { APIGatewayProxyResult, S3CreateEvent } from "aws-lambda";

export async function handler(event: S3CreateEvent): Promise<APIGatewayProxyResult> {
    const key = event.Records[0].s3.object.key;
    const BUCKET = process.env.BUCKET || "";
    const APP_ID = process.env.APP_ID || "";

    const input: GetObjectCommandInput = {
        Bucket: BUCKET,
        Key: key
    };

    try {
        const client = new S3Client();
        const response = await client.send(new GetObjectCommand(input));
        const userId = response.Metadata?.userid || "";
        const interactionToken = response.Metadata?.interactiontoken || "";
        const objectURL = `https://${BUCKET}.s3.eu-north-1.amazonaws.com/${key}`;

        const discordResponse = await fetch(`https://discord.com/api/webhooks/${APP_ID}/${interactionToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: `Your AI generated image!\n<@${userId}>\n${objectURL}`
            })
        });

        const responseText = await discordResponse.text();
        console.log(responseText);

        return {
            statusCode: 200,
            body: "ok"
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: "error"
        };
    }
}
