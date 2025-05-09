import crypto from 'node:crypto';

import { prisma } from '@charmverse/core/prisma-client';
import { WebhookNameSpaces } from '@packages/lib/webhookPublisher/interfaces';

export function createSigningSecret() {
  return crypto.randomBytes(160 / 8).toString('hex');
}

// Generate prisma operations
export async function subscribeToEvents(events: Record<string, boolean>, spaceId: string, userId: string) {
  const operationArray = [];

  for (const [scope, subscribed] of Object.entries(events)) {
    // The deletedAt is the key factor determining the subscription here
    // If not present, the space will be subscribed to that event
    const deletedAt = subscribed ? null : new Date();

    // Push the operation in the array
    operationArray.push(
      prisma.webhookSubscription.upsert({
        where: {
          scope_spaceId: {
            scope,
            spaceId: spaceId as string
          }
        },
        update: {
          deletedAt,
          createdBy: userId
        },
        create: {
          scope,
          spaceId: spaceId as string,
          deletedAt,
          createdBy: userId
        }
      })
    );
  }

  // Update the subscriptions
  await prisma.$transaction([...operationArray]);
}

export function subscribeToAllEvents({ spaceId, userId }: { spaceId: string; userId: string }) {
  const allEvents = Object.values(WebhookNameSpaces).reduce(
    (obj, cur) => {
      obj[cur] = true;
      return obj;
    },
    {} as Record<string, boolean>
  );
  return subscribeToEvents(allEvents, spaceId, userId);
}
