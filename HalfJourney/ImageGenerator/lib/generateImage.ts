import { PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';

export async function generate(UserId: string, PromptId: string, prompt: string, interactionId: string, interactionToken: string): Promise<string> {

    const body = JSON.stringify({
        "cfg_scale": 8,
        "height": 512,
        "width": 512,
        "sampler": "DDIM",
        "samples": 1,
        "steps": 50,
        "text_prompts": [
            {
                "text": prompt,
                "weight": 1
            }
        ]
    });

    const Headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.APIKEY}`,
    };

    try {
        const url = "https://api.stability.ai/v1/generation/stable-diffusion-v1-5/text-to-image";

        const res = await fetch(url, {
            method: "POST",
            headers: Headers,
            body: body
        });

        if (!res.ok) {
            console.log(res.statusText);
            throw new Error(`Non-200 response: ${await res.text()} ${res.statusText}`);
        }

        const data = await res.json();
        // Since we only ask for one image, we just pick the first in the one item array
        const img = Buffer.from(data?.artifacts?.[0]?.base64 || '', "base64");

        // Upload image to S3
        const s3 = new S3Client();
        const key = `public/${UserId}/${PromptId}.png`;
        const params2: PutObjectCommandInput = {
            Bucket: process.env.BUCKET || "",
            Key: key,
            Body: img,
            Metadata: {
                "interactionId": interactionId,
                "userId": UserId,
                "promptId": PromptId,
                "interactionToken": interactionToken
            }
        };
        await s3.send(new PutObjectCommand(params2));

        return key;
    } catch (err) {
        console.error(err);
        return "";
    }
}
