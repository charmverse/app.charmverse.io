import { prisma } from '@charmverse/core/prisma-client';

import { getActiveSpaceSubscription } from './getActiveSpaceSubscription';
import { stripeClient } from './stripe';

export async function deleteProSubscription({ spaceId, userId }: { spaceId: string; userId: string }) {
  const spaceSubscription = await getActiveSpaceSubscription({ spaceId });

  await prisma.stripeSubscription.updateMany({
    where: {
      spaceId,
      deletedAt: null
    },
    data: {
      deletedAt: new Date()
    }
  });

  // Only update to cancelled status if the space is not already free
  await prisma.space.update({
    where: {
      id: spaceId,
      deletedAt: null,
      paidTier: {
        not: 'free'
      }
    },
    data: {
      updatedAt: new Date(),
      updatedBy: userId,
      paidTier: 'cancelled'
    }
  });

  // Always try to cancel the stripe subscription
  if (spaceSubscription?.subscriptionId) {
    await stripeClient.subscriptions.cancel(spaceSubscription.subscriptionId);
  }
}
