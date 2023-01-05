import type { Space } from '@prisma/client';
import type { WebhookEventNames, WebhookEvent, WebhookPayload } from 'serverless/webhook/interfaces';

import { prisma } from 'db';
import { addMessageToSQS } from 'lib/aws/SQS';
import log from 'lib/log';

const SQS_QUEUE_NAME = process.env.SQS_WEBHOOK_QUEUE_NAME;

// This function check subscription status by event name AND name space
async function fetchSpaceWebhookSubscriptionStatus(spaceId: Space['id'], scope: string) {
  // scope = `{nameSpace}.{specificEventname}`
  const [nameSpace] = scope.split('.');

  const webhookSubscription = await prisma.webhookSubscription.findFirst({
    where: {
      spaceId,
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
          webhookSubscriptionUrl: true
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
    if (!subscription || !subscription.space.webhookSubscriptionUrl) {
      return;
    }

    const webhookPayload: WebhookPayload = {
      event,
      createdAt: new Date().toISOString(),
      spaceId,
      webhookURL: subscription.space.webhookSubscriptionUrl
    };

    // Add the message to the queue
    await addMessageToSQS(SQS_QUEUE_NAME, JSON.stringify(webhookPayload));
  } catch (e) {
    log.error('Error while publishing webhook event. Error occurred', e);
  }
}
