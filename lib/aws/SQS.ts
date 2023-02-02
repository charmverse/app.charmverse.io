import { SQS } from '@aws-sdk/client-sqs';

const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY as string;
const AWS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_REGION = process.env.AWS_REGION;

// Connect to SQS
const sqs = new SQS({
  apiVersion: 'latest',
  region: AWS_REGION || 'us-east-1',
  credentials: {
    secretAccessKey: AWS_SECRET,
    accessKeyId: AWS_KEY_ID
  }
});

export async function addMessageToSQS(queueUrl: string, stringifiedBody: string) {
  await sqs.sendMessage({
    QueueUrl: queueUrl,
    MessageBody: stringifiedBody,
    MessageGroupId: 'webhook-message'
  });
}
