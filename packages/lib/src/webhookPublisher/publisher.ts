import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { isTestEnv } from '@packages/config/constants';
import { addMessageToSQS } from '@packages/lib/aws/SQS';
import type { WebhookEvent, WebhookPayload } from '@packages/lib/webhookPublisher/interfaces';

const SQS_QUEUE_NAME = process.env.SQS_WEBHOOK_PUBLISHER_QUEUE_NAME;

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

export async function publishWebhookEvent(spaceId: string, event: WebhookEvent) {
  try {
    if (!SQS_QUEUE_NAME) {
      throw new Error('Webhook SQS env var missing');
    }

    const webhookPayload: WebhookPayload = {
      event,
      createdAt: new Date().toISOString(),
      spaceId,
      webhookURL: null,
      signingSecret: null
    };

    // Find if the space is subscribed to an event name or name space
    const subscription = await fetchSpaceWebhookSubscriptionStatus(spaceId, event.scope);

    if (subscription && subscription.space.webhookSubscriptionUrl && subscription.space.webhookSigningSecret) {
      webhookPayload.webhookURL = subscription.space.webhookSubscriptionUrl;
      webhookPayload.signingSecret = subscription.space.webhookSigningSecret;
    }

    // Add the message to the queue
    if (event.scope === 'document.mention.created') {
      setTimeout(() => {
        addMessageToSQS(SQS_QUEUE_NAME, JSON.stringify(webhookPayload));
      }, 15000);
    } else {
      await addMessageToSQS(SQS_QUEUE_NAME, JSON.stringify(webhookPayload));
    }

    log.debug(`Sent webhook event to SQS: "${event.scope}"`, {
      spaceId,
      queueUrl: SQS_QUEUE_NAME,
      createdAt: webhookPayload.createdAt,
      webhookURL: webhookPayload.webhookURL
    });
  } catch (e) {
    if (!isTestEnv) {
      log.error('Error while publishing webhook event. Error occurred', {
        queueUrl: SQS_QUEUE_NAME,
        error: e,
        scope: event.scope,
        spaceId
      });
    }
  }
}
