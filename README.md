# Blog

# **Part 1: Setting up a Discord Bot and AWS Integration**

![Untitled](https://halfjourneybucket1234.s3.eu-north-1.amazonaws.com/public/readme/1.png)

In this post, we will walk through the process of setting up a Discord bot and integrating it with AWS using the Serverless Application Model (SAM) for a seamless development experience. This is the first part of a multi-part series, so let's get started.

## **Setting Up Your Discord Bot**

1. Go to [Discord Developer Portal](https://discord.dev/).
2. In the sidebar, click on "Applications" and then select "New Application."

!https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/abf91d2a-f5a3-48e6-8057-26d2ab54eada/Untitled.png

1. Enter a name for your bot, and you will be brought to your bot information page. Make sure to note down your application ID and public key, as you'll need them later.

![Untitled](https://halfjourneybucket1234.s3.eu-north-1.amazonaws.com/public/readme/2.png)

1. Feel free to add more information about your bot.
2. In the sidebar, go to "Bot" and reset your secret token. Keep this token safe; it's called a secret token for a reason.

Congratulations! You now have your Discord bot set up. Let's proceed to the AWS integration.

![Untitled](https://halfjourneybucket1234.s3.eu-north-1.amazonaws.com/public/readme/3.png)

For this project we wont need to fill in all of the urls, but the “interaction endpoint url”, this is how we will connect our discordbot to aws

## **What You Need from AWS**

To streamline our AWS setup, we will use the Serverless Application Model (SAM) CLI. SAM simplifies development and allows us to locally test our functions, as well as use TypeScript with the help of esbuild.

Make sure you have SAM CLI and Docker installed. You can follow the installation steps for SAM CLI [here](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) and for Docker [here](https://docs.docker.com/desktop/install/windows-install/).

Now, navigate to the directory where you want to store your project.

In your terminal (e.g., VSCode terminal), run the following command:

```bash
sam init
```

Choose "AWS Quick Start Templates" to kickstart your development.

Select the "Hello World Example" and choose "No" when asked if you want to use the most popular runtime. You can use Python if you prefer, but we'll use TypeScript in this guide.

When asked about the package type, choose "Zip" to enable TypeScript support. Choose "No" for all remaining questions.

Your project structure should now look like this:

![Untitled](https://halfjourneybucket1234.s3.eu-north-1.amazonaws.com/public/readme/4.png)

Let's take a closer look at what SAM has generated for us.

The **`events/event.json`** file can be used to test your Lambda function. You can use it with the **`sam local invoke`** command to test locally.

If you want to see the available SAM CLI commands, you can run **`sam -h`**. For local invocation, use **`sam local invoke -h`** to see the options.

To build your project, run:

```bash
sam build
```

Now, let's test your Lambda function locally with the provided event:

```bash

sam local invoke HelloWorldFunction -e events/event.json

```

You should see a response.

![Untitled](https://halfjourneybucket1234.s3.eu-north-1.amazonaws.com/public/readme/5.png)

To deploy your project to the cloud, use the following command:

```bash

sam deploy

```

This will create the necessary AWS resources. Note down the endpoint URL, as you'll need it for the Discord bot integration.

whenever we make changes we need to build and deploy. You can also use sam validate to lint your .yaml file.

## **Discord Bot Verification**

lets get the endpoint URL, since we need that for the discord bot.

you should get this error if you try to save your changes

![Untitled](https://halfjourneybucket1234.s3.eu-north-1.amazonaws.com/public/readme/7.png)

If you attempt to save changes in your Discord bot, you might encounter an error related to security and authorization. To address this, you need to modify your Lambda function code to enable verification.

To use TypeScript types for Discord, run the following command in your terminal:

```bash

npm install discord-api-types
```

Make sure to add the dependencies in your **`package.json`** in the Lambda function directory.

```json
HalfJourney/hello-world/package.json

...

"dependencies": {
    "esbuild": "^0.14.14",
    "discord-api-types": "^0.37.62",
    "tweetnacl": "^1.0.3"
  },
...
```

Next, modify your Lambda function code as shown below:

```tsx

HalfJourney/hello-world/app.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    APIInteraction,
    APIChatInputApplicationCommandInteraction,
} from 'discord-api-types/payloads/v10/interactions';
import { verify } from './lib/verify';
import { handleCommand } from './lib/handleCommand';

export async function lambdaHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
```

```tsx

HalfJourney/hello-world/lib/verify.ts

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
```

When responding to Discord requests, always ensure that the body is stringified.

Now, try saving your changes in the Discord bot; it should work without errors.

![Untitled](https://halfjourneybucket1234.s3.eu-north-1.amazonaws.com/public/readme/8.png)

## **Renaming Lambda Function and API Gateway**

Before we wrap up Part 1, let's rename your Lambda function and API Gateway to "InteractionHandler." Update your YAML file and the directory structure accordingly.

Your project structure should now look like this:

![Untitled](https://halfjourneybucket1234.s3.eu-north-1.amazonaws.com/public/readme/9.png)

You can validate your SAM project using the following command:

```bash

sam validate
```

And then build and deploy your updated project.

That's it for Part 1. In the next part, we will continue building and enhancing our Discord bot and AWS integration.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  HalfJourney

  Sample SAM Template for HalfJourney

Globals:
  Function:
    Timeout: 10
    Handler: app.handler
    Runtime: nodejs18.x
    Architectures:
      - x86_64

Resources:
  InteractionHandler:
    Type: AWS::Serverless::Function 
    Properties:
      CodeUri: InteractionHandler/
      Events:
        HalfJourneyApi:
          Type: Api 
          Properties:
            Path: /
            Method: post
      Environment:
        Variables:
          PUBLIC_KEY: <your public key>
          TABLENAME: HalfJourneyTable
      Policies:
        - DynamoDBCrudPolicy:
            TableName: HalfJourneyTable
    Metadata: 
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        Sourcemap: true
        External:
        - "@aws-sdk/*"
        EntryPoints: 
        - app.ts
Outputs:
  HalfJourneyApi:
    Description: "API Gateway endpoint URL for Prod stage for Halfjourney discord bot"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod"
  InteractionHandler:
    Description: "InteractionHandler Lambda Function ARN"
    Value: !GetAtt InteractionHandler.Arn
  InteractionHandlerRole:
    Description: "Implicit IAM Role created for Hello World function"
    Value: !GetAtt InteractionHandler.Arn
```

# **Part 2: Creating Slash Commands, Command Builder, and Database Integration**

In Part 1, we successfully set up the connection between Discord and AWS, and now we'll continue by creating a way for users to use slash commands (e.g., **`/imagine`**) and setting up Lambda functions to handle these interactions. We will also integrate a database to store user prompts.

## **Lambda Function Structure**

To keep our code organized and efficient, we'll break down the functionality into different Lambda functions (it is usually also cost effective to have short running lambdas) :

1. **InteractionHandler**: This Lambda function handles all interactions with Discord. To keep track of user prompts, we will connect to a DynamoDB table from this function.
2. **CommandBuilder**: This Lambda function is used to build commands for our Discord bot. To build commands you can run the code from anywhere, I just choose lambda since I want to manage everything in one place.

Here's the architectural overview:

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/92416184-1ee5-47f6-88c1-16abca20a039/Untitled.png)

## **Setting Up CommandBuilder**

1. Create a new Lambda function named "CommandBuilder" with a POST method at **`/commands`**. This function is responsible for creating the bot's slash commands. You can use tools like Postman to make requests to this function.
2. To create a command, you can use a JSON object like this:

```json

{
    "name": "imagine",
    "type": 1,
    "description": "Generate an image based on the user's prompt",
    "options": [
        {
            "name": "prompt",
            "description": "Enter a prompt for the image",
            "type": 3,
            "required": true}
    ]
}

```

This example defines a simple slash command called **`/imagine`** that takes a user-provided prompt as an option.

1. In the Lambda function code, you can use the following code to create the command on Discord. Make sure your application's ID and bot token are in your environment variables.

```tsx
HalfJourney/CommandBuilder/app.ts

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
```

```yaml
CommandBuilder:
    Type: AWS::Serverless::Function 
    Properties:
      CodeUri: CommandBuilder/
      Events:
        HalfJourneyApi:
          Type: Api 
          Properties:
            Path: /commands
            Method: post
      Environment:
        Variables:
          APP_ID: <your app id>
          BOT_TOKEN: <your bot token>
    Metadata: 
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        Sourcemap: true
        EntryPoints: 
        - app.ts
```

After creating the command, you can use Discord's URL generator to invite your bot to your server. 

https://discord.com/developers/applications/1171867441895325888/oauth2/url-generator

Test your new command in Discord.

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/261bfbf9-a676-493e-bf02-18144b22371f/Untitled.png)

## **Adjusting InteractionHandler for Slash Commands**

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/22de8815-3caf-444f-8e7c-e6fb03e9bc53/Untitled.png)

1. Modify the **`InteractionHandler`** Lambda function to handle slash commands. You can adjust the code like this:

```tsx
HalfJourney/InteractionHandler/app.ts

...
switch (type) {
    case 1:
        // Type 1 is for PING, used for endpoint verification
        return verify(event);
    case 2:
        // Slash command
        return handleCommand((discordEvent as APIChatInputApplicationCommandInteraction))
    default:
        // Handle unhandled types
}
...
```

1. Create a new file named **`handleCommand.ts`** and add the following code:

```tsx
HalfJourney\InteractionHandler\lib\handleCommand.ts

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

```

1. Create a new file named **`imagine.ts`** for handling the **`/imagine`** command:

```tsx
HalfJourney\InteractionHandler\lib\imagine.ts

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
```

## **Adding the DynamoDB Table**

Finally, to store user prompts, you need to add a DynamoDB table to your AWS infrastructure. Here's an example of how to define the table in your SAM template:

```yaml
yamlCopy code
HalfJourneyTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: "HalfJourneyTable"
      AttributeDefinitions:
        -
          AttributeName: "UserId"
          AttributeType: "S"
        -
          AttributeName: "PromptId"
          AttributeType: "S"
      KeySchema:
        -
          AttributeName: "UserId"
          KeyType: "HASH"
        -
          AttributeName: "PromptId"
          KeyType: "RANGE"
      ProvisionedThroughput:
        ReadCapacityUnits: "5"
        WriteCapacityUnits: "5"

```

Make sure you adjust the environment variables and policies for your **`InteractionHandler`** Lambda function to include the **`TABLENAME`** and the necessary DynamoDB access permissions.

```yaml
add this to your InteractionHandler
...
Environment:
        Variables:
          PUBLIC_KEY: yourkey
          TABLENAME: HalfJourneyTable
      Policies:
        - DynamoDBCrudPolicy:
            TableName: HalfJourneyTable
...
```

That's it for Part 2! You have set up slash commands, created a CommandBuilder Lambda function, and integrated a DynamoDB table to store user prompts. In Part 3, you can proceed to generate AI images based on user prompts.

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/16080ead-f28e-492b-9127-4bdb4165f0ec/Untitled.png)

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/2c68b03b-419b-4664-b82c-622c9987d6cc/Untitled.png)

# Part 3: Image Generation and Storing in S3

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/df85095f-0c57-4566-80e7-59bf34f9e52f/Untitled.png)

In Part 2, we set up the command builder and integrated a DynamoDB table to store user prompts. Now, in Part 3, we will focus on image generation and storing these images in an S3 bucket.

## Modifying DynamoDB Table to Send Messages

To trigger image generation when prompts are added to the DynamoDB table, you need to configure it to send messages to an AWS Lambda function. Update your DynamoDB table resource in your SAM template to include a StreamSpecification with StreamViewType set to NEW_IMAGE. This allows your Lambda function to be triggered whenever new items are inserted into the table. Here's the updated section in your SAM template:

```yaml
...
HalfJourneyTable:
    Type: AWS::DynamoDB::Table
    Properties:
        ...
        StreamSpecification:
            StreamViewType: NEW_IMAGE
...
```

## Creating the ImageGenerator Function

1. Create a new Lambda function named "ImageGenerator" in your SAM template. This function is responsible for generating images based on user prompts and storing them in an S3 bucket.
2. Configure the function to use Node.js 18.x runtime and set a longer timeout (e.g., 900 seconds) to allow image generation to complete.
3. Set up the function's code using the provided `app.ts` file. This code handles the image generation process.
4. In the function's events section, define the DDBStream event source, which is triggered by new items in the DynamoDB table:

```yaml
ImageGenerator:
    Type: AWS::Serverless::Function 
    Properties:
      Timeout: 900
      CodeUri: ImageGenerator/
      Events:
        DDBStream:
          Type: DynamoDB
          Properties:
            Stream:
              !GetAtt HalfJourneyTable.StreamArn
            StartingPosition: LATEST
            BatchSize: 20
            Enabled: true
            FilterCriteria:
              Filters:
                - Pattern: '{ "dynamodb" : { "NewImage" : { "Key" :  [ { "exists": false } ] } } }'
      Environment:
        Variables:
          BUCKET: halfjourneybucket1234
          TABLENAME: HalfJourneyTable
          APIKEY: <your api key>
      Policies:
        - DynamoDBCrudPolicy:
            TableName: HalfJourneyTable
        - S3CrudPolicy:
            BucketName: halfjourneybucket1234
    Metadata: 
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        External:
        - '@aws-sdk/*'
        Sourcemap: true
        EntryPoints: 
        - app.ts

```

The `FilterCriteria` is used to ensure that the Lambda function is triggered only for new prompts that don't yet have a generated image.

1. Set environment variables for the function, including the S3 bucket name, the DynamoDB table name, and an API key for the image generation service:
2. Attach necessary policies to the Lambda function. In this example, you should have policies like `DynamoDBCrudPolicy` for your DynamoDB table and `S3CrudPolicy` for your S3 bucket.
3. Use the provided `app.ts` code to handle image generation. The `generate` function is responsible for interacting with the image generation service provided by [stability.io](http://stability.io/).
4. After generating the image, the code uploads it to the S3 bucket using the AWS SDK for S3.

```tsx
HalfJourney/ImageGenerator/app.ts

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
```

```tsx
HalfJourney/ImageGenerator/lib/generateImage.ts

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
```

---

imageGenerator with Bedrock

when using bedrock there are a few steps you need to take first.

1. Not all regions are supported, we use us-west-2
2. You have to request model access, https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/modelaccess

```yaml
ImageGeneratorBedrock:
    Type: AWS::Serverless::Function 
    Properties:
      Timeout: 900
      CodeUri: ImageGeneratorBedrock/
      Runtime: python3.11
      Events:
        DDBStream:
          Type: DynamoDB
          Properties:
            Stream:
              !GetAtt HalfJourneyTable.StreamArn
            StartingPosition: LATEST
            BatchSize: 20
            Enabled: true
            FilterCriteria:
              Filters:
                - Pattern: '{ "dynamodb" : { "NewImage" : { "Key" :  [ { "exists": false } ] } } }'
      Environment:
        Variables:
          BUCKET: halfjourneybucket1234
          TABLENAME: HalfJourneyTable
          APIKEY: <your api key>
      Policies:
        - DynamoDBCrudPolicy:
            TableName: HalfJourneyTable
        - S3CrudPolicy:
            BucketName: halfjourneybucket1234
        - Version: '2012-10-17'
          Statement:
            - Sid: BedrockPolicy
              Effect: Allow
              Action:
                - bedrock:*
              Resource: '*'
```

```python
HalfJourney/ImageGeneratorBedrock/app.py

import base64
import json
import boto3
import os

# Initialize the database name from the environment variable
database_name = os.environ['TABLENAME']

client = boto3.client('bedrock-runtime', region_name='us-west-2')
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def handler(event, handler):
    # get record from dynamodb stream event
    record: dict = event['Records'][0]['dynamodb']['NewImage']
    event_type: str = event['Records'][0]['eventName']
    print(f"""Record: {record}, Event_Type: {event_type}""")

    if event_type != 'INSERT':
        return {
            "statusCode": 200,
            "body": "ignore"
        }

    # generate variables extracted from record
    user_id: str = record['UserId']['S']
    prompt_id: str = record['PromptId']['S']
    prompt: str = record['prompt']['S']
    interaction_id: str = record['InteractionId']['S']
    interaction_token: str = record['InteractionToken']['S']

    print(f"""User_Id: {user_id}, Prompt_Id: {prompt_id}, Prompt: {prompt}, Interaction_Id: {interaction_id}, 
    Interaction_Token: {interaction_token}""")

    # generate image
    key: str = generate(user_id, prompt_id, prompt, interaction_id, interaction_token)

    # update dynamodb record with image key
    table = dynamodb.Table(database_name)
    table.update_item(
        Key={
            'UserId': user_id,
            'PromptId': prompt_id
        },
        UpdateExpression="set #key = :k",
        ExpressionAttributeNames= {
                "#key": "Key"
            },
        ExpressionAttributeValues={
            ':k': key
        },
    )

    return {
        "statusCode": 200,
        "body": "Hello from Lambda!"
    }

def generate(user_id: str, prompt_id: str, prompt: str, interaction_id: str, interaction_token: str) -> str:
    # construct body
    body: str = json.dumps({
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
    })
    # invoke bedrock-runtime model
    response: dict = client.invoke_model(
        body=body,
        modelId='stability.stable-diffusion-xl-v0'
    )

    # store image in S3
    key: str = f"public/{user_id}/{prompt_id}.png"

    response_body = json.loads(response.get("body").read())
    print(response_body['result'])
    img = response_body.get("artifacts")[0].get("base64")
    img64 = base64.b64decode(img)

    print(img64)

    s3_client.put_object(Body=img64, Bucket='halfjourneybucket1234', Key=key,
                         Metadata={
                                 'interactionId': interaction_id,
                                 'userId': user_id,
                                 'promptId': prompt_id,
                                 'interactionToken': interaction_token
                             }
                         )
    # return object key
    return key
```

## Creating the S3 Bucket

```yaml
S3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: halfjourneybucket1234
      PublicAccessBlockConfiguration:
                BlockPublicAcls: false
                BlockPublicPolicy: false
                IgnorePublicAcls: false
                RestrictPublicBuckets: false
  MyBucketPolicy:
            Type: 'AWS::S3::BucketPolicy'
            Properties:
              Bucket:
                Ref: 'S3Bucket'
              PolicyDocument:
                Version: '2012-10-17'
                Statement:
                  - Effect: Allow
                    Principal: '*'
                    Action: 's3:GetObject'
                    Resource:
                      Fn::Join:
                        - ''
                        - - 'arn:aws:s3:::'
                          - Ref: 'S3Bucket'
                          - '/public/*'
```

With these configurations, the ImageGenerator Lambda function will be triggered whenever a new prompt is added to the DynamoDB table. It will generate an image based on the prompt and store it in the S3 bucket.

Now, you are ready to proceed to Part 4, where you can work on delivering these generated images back to the users.

For testing we will use low quality images

lets test it!

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/98db3d4e-0ed3-4199-912b-80de432b6b97/Untitled.png)

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/269fd294-fa78-4f85-97d4-6cc9d56579a5/Untitled.png)

![1171866087638438039-1699724061143.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/62a5b3cd-0271-4692-aed2-cffee92a5dae/1171866087638438039-1699724061143.png)

# Part IV: Notifying Users and Wrap up

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/d75d5ab4-c4ec-4f94-92c8-b297672a2593/Untitled.png)

In the final part of building HalfJourney, the goal is to notify users when an image is generated.This section outlines the creation of a Notifier function to accomplish this.

## Creating the Notifier Function

The Notifier function is responsible for notifying users when images are ready. Here's the relevant YAML configuration:

```yaml
Notifier:
    Type: AWS::Serverless::Function 
    Properties:
      CodeUri: Notifier/
      Events:
        S3Event:
          Type: S3
          Properties:
            Bucket:
              Ref: S3Bucket  
            Events: s3:ObjectCreated:*
            Filter:
              S3Key:
                Rules:
                - Name: suffix    
                  Value: .png      

      Environment:
        Variables:
          APP_ID: <your app id>
          BUCKET: halfjourneybucket1234
    Metadata: 
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        Sourcemap: true
        External: 
        - '@aws-sdk/*'
        EntryPoints: 
        - app.ts
```

This function is triggered by S3 events whenever a .png file is uploaded to the specified S3 bucket.

The Notifier function retrieves the object from the S3 bucket, retrieves user and interaction details, and sends a notification to Discord with a link to the generated image.

## Notifier Function Code

The code for the Notifier function:

```tsx
HalfJourney/Notifier/app.ts

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
```

This code retrieves the image from the S3 bucket, sends a notification to Discord, and handles errors.

## Testing the Notifier

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cf23beb8-b835-4018-a25f-6dcaeac0a3af/25c304b7-9a30-4694-afb3-0218d468e97a/Untitled.png)

there we go! our generated image!

feel free to add more features to it! 

also tag me or let me know if you added any cool features or if you took another approach to do something similar!

thanks for hanging!

now look at this multi legged wolf!
