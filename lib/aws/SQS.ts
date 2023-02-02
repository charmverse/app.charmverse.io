import { SQS } from '@aws-sdk/client-sqs';

const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY as string;
const AWS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;

// Connect to SQS
const sqs = new SQS({
  apiVersion: 'latest',
  region: process.env.AWS_REGION,
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
