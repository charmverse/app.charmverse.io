import { SQSClient, ReceiveMessageCommand, GetQueueUrlCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

import log from 'lib/log';
import type { WebhookMessage } from 'lib/webhooks/interfaces';

type ProcessMssagesInput = {
  maxNumOfMessages?: number;
  processorFn: (messageBody: WebhookMessage) => Promise<boolean>;
};

const SQS_KEY = process.env.SQS_KEY as string;
const SQS_SECRET = process.env.SQS_SECRET as string;
const SQS_REGION = process.env.SQS_REGION as string;
const SQS_NAME = process.env.SQS_NAME as string;
const client = new SQSClient({
  region: SQS_REGION,
  credentials: { accessKeyId: SQS_KEY, secretAccessKey: SQS_SECRET }
});

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
  const QueueUrl = await getQueueUrl();
  if (QueueUrl) {
    const command = new ReceiveMessageCommand({ QueueUrl, MaxNumberOfMessages: 1 });
    const res = await client.send(command);

    return res?.Messages?.[0] || null;
  }

  return null;
}

export async function deleteMessage(receipt: string) {
  const QueueUrl = await getQueueUrl();
  const command = new DeleteMessageCommand({ ReceiptHandle: receipt, QueueUrl });
  const res = await client.send(command);

  return res.$metadata.httpStatusCode === 200;
}

export async function processMessages({ processorFn }: ProcessMssagesInput) {
  const message = await getNextMessage();

  if (!message) {
    return false;
  }

  let msgBody: Record<string, any> | string = '';
  try {
    msgBody = JSON.parse(message.Body || '');
    // eslint-disable-next-line no-empty
  } catch (e) {}

  try {
    // process message
    await processorFn(msgBody as WebhookMessage);
    // delete if processed correctly
    await deleteMessage(message.ReceiptHandle || '');
  } catch (e) {
    log.error('Failed to process webhook message', e);
  }

  // process next message
  setTimeout(() => processMessages({ processorFn }), 1000);
  return true;
}
