import type { Space } from '@prisma/client';
import type { WebhookEventNames, WebhookEvent, WebhookPayload } from 'serverless/webhook/interfaces';

import { addMessageToSQS } from 'lib/aws/SQS';
import log from 'lib/log';

const SQS_QUEUE_NAME = process.env.SQS_WEBHOOK_QUEUE_NAME;

export async function publishWebhookEvent<T = WebhookEventNames>(spaceId: Space['id'], event: WebhookEvent<T>) {
  const webhookPayload: WebhookPayload = {
    event,
    createdAt: new Date().toISOString(),
    spaceId
  };
  try {
    if (!SQS_QUEUE_NAME) {
      throw new Error('Webhook SQS env var missing');
    }

    await addMessageToSQS(SQS_QUEUE_NAME, JSON.stringify(webhookPayload));
  } catch (error) {
    log.error('Could not add message to webhook SQS queue. Error occurred', error);
  }
}
