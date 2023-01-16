import type { SQSClientConfig } from '@aws-sdk/client-sqs';
import { SQSClient, ReceiveMessageCommand, GetQueueUrlCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

import { AWS_REGION, SQS_NAME } from 'lib/aws/config';
import log from 'lib/log';
import type { WebhookMessage } from 'lib/webhooks/interfaces';

type ProcessMssagesInput = {
  maxNumOfMessages?: number;
  processorFn: (messageBody: WebhookMessage) => Promise<any>;
};

const AWS_API_KEY = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_API_SECRET = process.env.AWS_SECRET_ACCESS_KEY as string;
const SQS_REGION = (process.env.AWS_REGION as string) || AWS_REGION;

const config: SQSClientConfig = { region: SQS_REGION };
if (AWS_API_KEY && AWS_API_SECRET) {
  config.credentials = { accessKeyId: AWS_API_KEY, secretAccessKey: AWS_API_SECRET };
}

const client = new SQSClient(config);
let queueUrl = '';

export async function getQueueUrl() {
  if (queueUrl) {
    return queueUrl;
  }

  const command = new GetQueueUrlCommand({ QueueName: SQS_NAME });
  const res = await client.send(command);
  queueUrl = res.QueueUrl || '';
  return queueUrl;
}

export async function getNextMessage() {
  try {
    const QueueUrl = await getQueueUrl();
    if (QueueUrl) {
      // 20s polling time
      const command = new ReceiveMessageCommand({ QueueUrl, MaxNumberOfMessages: 1, WaitTimeSeconds: 20 });
      const res = await client.send(command);

      return res?.Messages?.[0] || null;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function deleteMessage(receipt: string) {
  const QueueUrl = await getQueueUrl();
  const command = new DeleteMessageCommand({ ReceiptHandle: receipt, QueueUrl });
  const res = await client.send(command);

  return res.$metadata.httpStatusCode === 200;
}

export async function processMessages({ processorFn }: ProcessMssagesInput) {
  const message = await getNextMessage();

  if (message) {
    let msgBody: Record<string, any> | string = '';
    try {
      msgBody = JSON.parse(message.Body || '');
    } catch (e) {
      log.warn('SQS message body failes to parse', e);
    }

    try {
      // process message
      await processorFn(msgBody as WebhookMessage);
    } catch (e) {
      log.error('Failed to process webhook message', e);
    } finally {
      await deleteMessage(message.ReceiptHandle || '');
    }
  }

  // process next message
  processMessages({ processorFn });
}
