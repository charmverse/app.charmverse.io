import type { SQSClientConfig } from '@aws-sdk/client-sqs';
import { SQS } from '@aws-sdk/client-sqs';

import { AWS_REGION } from './config';

const AWS_API_KEY = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_API_SECRET = process.env.AWS_SECRET_ACCESS_KEY as string;
const SQS_REGION = (process.env.AWS_REGION as string) || AWS_REGION;

const config: SQSClientConfig = { region: SQS_REGION, apiVersion: 'latest' };

if (AWS_API_KEY && AWS_API_SECRET) {
  config.credentials = { accessKeyId: AWS_API_KEY, secretAccessKey: AWS_API_SECRET };
}

// Connect to SQS
const sqs = new SQS(config);

export async function addMessageToSQS(queueUrl: string, stringifiedBody: string) {
  await sqs.sendMessage({
    QueueUrl: queueUrl,
    MessageBody: stringifiedBody,
    MessageGroupId: 'webhook-message'
  });
}
