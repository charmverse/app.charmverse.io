import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { getActiveSpaceSubscription } from './getActiveSpaceSubscription';
import { stripeClient } from './stripe';

export async function updateToFreeTier(spaceId: string, userId: string) {
  const subscription = await getActiveSpaceSubscription({ spaceId });

  if (!subscription) {
    const space = await prisma.space.findFirst({ where: { id: spaceId } });
    if (!space) {
      throw new DataNotFoundError('Space not found');
    } else if (space.paidTier === 'enterprise') {
      throw new InvalidInputError(`This space is already on the enterprise plan`);
    }
  }

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
