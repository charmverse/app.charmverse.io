import type { SQSClientConfig } from '@aws-sdk/client-sqs';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

import { AWS_REGION, SQS_URL } from 'lib/aws/config';
import { getLogger } from 'lib/log/prefix';
import type { WebhookMessage, WebhookMessageProcessResult } from 'lib/webhookConsumer/interfaces';

const log = getLogger('sqs');

type ProcessMssagesInput = {
  maxNumOfMessages?: number;
  processorFn: (messageBody: WebhookMessage) => Promise<WebhookMessageProcessResult>;
};

const AWS_API_KEY = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_API_SECRET = process.env.AWS_SECRET_ACCESS_KEY as string;
const SQS_REGION = (process.env.AWS_REGION as string) || AWS_REGION;

const config: SQSClientConfig = { region: SQS_REGION };
if (AWS_API_KEY && AWS_API_SECRET) {
  config.credentials = { accessKeyId: AWS_API_KEY, secretAccessKey: AWS_API_SECRET };
}

const client = new SQSClient(config);
const queueUrl = SQS_URL || '';

export async function getNextMessage() {
  try {
    if (queueUrl) {
      // 20s polling time
      const command = new ReceiveMessageCommand({ QueueUrl: queueUrl, MaxNumberOfMessages: 1, WaitTimeSeconds: 20 });
      const res = await client.send(command);

      return res?.Messages?.[0] || null;
    }

    return null;
  } catch (e) {
    log.error('Error while getting next message', e);
    return null;
  }
}

export async function deleteMessage(receipt: string) {
  const command = new DeleteMessageCommand({ ReceiptHandle: receipt, QueueUrl: queueUrl });
  const res = await client.send(command);

  return res.$metadata.httpStatusCode === 200;
}

export async function processMessages({ processorFn }: ProcessMssagesInput) {
  if (!queueUrl) {
    log.warn('SQS queue url not found. Aborting process messages.');
    return;
  }

  const message = await getNextMessage();

  if (message) {
    let msgBody: Record<string, any> | string = '';
    try {
      msgBody = JSON.parse(message.Body || '');
    } catch (e) {
      log.warn('SQS message body failed to parse', e);
    }

    try {
      // process message
      log.debug('Processing message', msgBody);
      const result = await processorFn(msgBody as WebhookMessage);

      log.debug('Message process successful:', result.success);
      if (result.message) {
        log.debug(result.message);
      }
    } catch (e) {
      log.error('Failed to process webhook message', e);
    } finally {
      log.debug('Deleting message', message.ReceiptHandle);
      await deleteMessage(message.ReceiptHandle || '');
    }
  } else {
    log.debug('No messages');
  }

  // process next message
  processMessages({ processorFn });
}
