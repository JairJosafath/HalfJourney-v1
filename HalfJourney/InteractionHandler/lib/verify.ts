import { APIGatewayProxyEvent } from "aws-lambda";
import nacl from "tweetnacl";

// Your public key can be found on your application in the Developer Portal
const PUBLIC_KEY = process.env.PUBLIC_KEY || "";

export function verify(event: APIGatewayProxyEvent) {

    const signature = event.headers["x-signature-ed25519"] || "";
    const timestamp = event.headers["x-signature-timestamp"] || "";
    const body = event.body; // rawBody is expected to be a string, not raw bytes
    const isVerified = nacl.sign.detached.verify(
        Buffer.from(timestamp + body),
        Buffer.from(signature, "hex"),
        Buffer.from(PUBLIC_KEY, "hex")
    )
    if (!isVerified) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: "invalid request signature",
            }),
        };
    }
    console.log("verification success")
    return {
        statusCode: 200,
        body: JSON.stringify({ type: 1 }),
    };

}
