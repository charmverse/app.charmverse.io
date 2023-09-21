import { prisma } from '@charmverse/core/prisma-client';

import { getActiveSpaceSubscription } from './getActiveSpaceSubscription';
import { stripeClient } from './stripe';

export async function updateToFreeTier(spaceId: string, userId: string) {
  const subscription = await getActiveSpaceSubscription({ spaceId });

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      updatedAt: new Date(),
      updatedBy: userId,
      paidTier: 'free'
    }
  });

  if (subscription) {
    await stripeClient.subscriptions.cancel(subscription.subscriptionId, {
      cancellation_details: {
        comment: 'Downgraded to free plan'
      }
    });

    await prisma.stripeSubscription.update({
      where: {
        id: subscription.id
      },
      data: {
        deletedAt: new Date()
      }
    });
  }

  return updatedSpace;
}
