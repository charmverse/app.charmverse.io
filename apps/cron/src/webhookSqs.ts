import type { SQSClientConfig } from '@aws-sdk/client-sqs';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { getLogger } from '@charmverse/core/log';
import { AWS_REGION } from '@root/lib/aws/config';

import type { WebhookMessageProcessResult } from './tasks/processCollablandWebhookMessages/webhook/interfaces';

const log = getLogger('sqs');

type ProcessMessagesInput<MessageBody> = {
  maxNumOfMessages?: number;
  processorFn: (messageBody: MessageBody) => Promise<WebhookMessageProcessResult>;
  queueUrl: string;
};

const AWS_API_KEY = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_API_SECRET = process.env.AWS_SECRET_ACCESS_KEY as string;
const SQS_REGION = (process.env.AWS_REGION as string) || AWS_REGION;

const config: SQSClientConfig = { region: SQS_REGION };
if (AWS_API_KEY && AWS_API_SECRET) {
  config.credentials = { accessKeyId: AWS_API_KEY, secretAccessKey: AWS_API_SECRET };
}

const client = new SQSClient(config);

export async function getNextMessage(queueUrl: string) {
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

export async function deleteMessage(receipt: string, queueUrl: string) {
  const command = new DeleteMessageCommand({ ReceiptHandle: receipt, QueueUrl: queueUrl });
  const res = await client.send(command);

  return res.$metadata.httpStatusCode === 200;
}

export async function processMessages<MessageBody>({ processorFn, queueUrl }: ProcessMessagesInput<MessageBody>) {
  if (!queueUrl) {
    log.warn('SQS queue url not found. Aborting process messages.');
    return;
  }

  const message = await getNextMessage(queueUrl);

  if (message) {
    let msgBody: Record<string, any> | string = '';
    try {
      msgBody = JSON.parse(message.Body || '');
    } catch (e) {
      log.warn('SQS message body failed to parse', e);
    }

    try {
      // process message
      log.debug('Processing message', { message: msgBody, receiptHandle: message.ReceiptHandle });
      const result = await processorFn(msgBody as MessageBody);

      if (result.success) {
        log.info(`Message process successful: ${result.message}`, {
          spaceId: result.spaceIds?.[0],
          spaceIds: result.spaceIds,
          receiptHandle: message.ReceiptHandle
        });
        try {
          await deleteMessage(message.ReceiptHandle || '', queueUrl);
        } catch (e) {
          log.error('Could not delete message', {
            receiptHandle: message.ReceiptHandle,
            error: e,
            spaceIds: result.spaceIds,
            spaceId: result.spaceIds?.[0]
          });
        }
      } else {
        log.warn(`Message process failed: ${result.message}`, {
          receiptHandle: message.ReceiptHandle,
          spaceIds: result.spaceIds,
          spaceId: result.spaceIds?.[0]
        });
      }
    } catch (e) {
      log.error('Failed to process webhook message', { error: e });
    }
  } else {
    log.debug('No messages');
  }

  // process next message
  await processMessages({ processorFn, queueUrl });
}
