import type { Space } from '@prisma/client';
import type { WebhookEventNames, WebhookEvent, WebhookPayload } from 'serverless/webhook/interfaces';

import { prisma } from 'db';
import { addMessageToSQS } from 'lib/aws/SQS';
import log from 'lib/log';

const SQS_QUEUE_NAME = 'charmverse-serverless-queue-dev.fifo'; // process.env.SQS_WEBHOOK_QUEUE_NAME;

// This function check subscription status by event name AND name space
async function fetchSpaceWebhookSubscriptionStatus(spaceId: Space['id'], scope: string) {
  // scope = `{nameSpace}.{specificEventname}`
  const [nameSpace] = scope.split('.');

  const webhookSubscription = await prisma.webhookSubscription.findFirst({
    where: {
      spaceId,
      deletedAt: undefined,
      OR: [
        {
          scope: {
            contains: nameSpace
          }
        },
        {
          scope: {
            equals: scope
          }
        }
      ]
    },
    include: {
      space: {
        select: {
          webhookSubscriptionUrl: true,
          webhookSigningSecret: true
        }
      }
    }
  });

  return webhookSubscription;
}

export async function publishWebhookEvent<T = WebhookEventNames>(spaceId: Space['id'], event: WebhookEvent<T>) {
  try {
    if (!SQS_QUEUE_NAME) {
      throw new Error('Webhook SQS env var missing');
    }
    // Find if the space is subscribed to an event name or name space
    const subscription = await fetchSpaceWebhookSubscriptionStatus(spaceId, event.scope);

    // If no subscription, we stop here
    if (!subscription || !subscription.space.webhookSubscriptionUrl || !subscription.space.webhookSigningSecret) {
      return;
    }

    const webhookPayload: WebhookPayload = {
      event,
      createdAt: new Date().toISOString(),
      spaceId,
      webhookURL: subscription.space.webhookSubscriptionUrl,
      signingSecret: subscription.space.webhookSigningSecret
    };

    // Add the message to the queue
    await addMessageToSQS(SQS_QUEUE_NAME, JSON.stringify(webhookPayload));
    log.debug('Sent webhook event to SQS', {
      spaceId,
      scope: event.scope,
      createdAt: webhookPayload.createdAt,
      webhookURL: webhookPayload.webhookURL
    });
  } catch (e) {
    log.warn('Error while publishing webhook event. Error occurred', { error: e, spaceId });
  }
}
