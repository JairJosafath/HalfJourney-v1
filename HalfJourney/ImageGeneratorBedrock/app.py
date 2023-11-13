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
