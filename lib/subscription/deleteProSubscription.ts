import { prisma } from '@charmverse/core/prisma-client';

import { NotFoundError } from 'lib/middleware';

import { stripeClient } from './stripe';

export async function deleteProSubscription({ spaceId, userId }: { spaceId: string; userId: string }) {
  const spaceSubscription = await prisma.stripeSubscription.findFirst({
    where: {
      spaceId,
      deletedAt: null
    },
    select: {
      customerId: true,
      subscriptionId: true,
      space: {
        select: {
          paidTier: true
        }
      }
    }
  });

  if (!spaceSubscription) {
    throw new NotFoundError('Subscription not found');
  }

  await prisma.stripeSubscription.update({
    where: {
      subscriptionId: spaceSubscription.subscriptionId,
      spaceId
    },
    data: {
      deletedAt: new Date()
    }
  });

  // Only update to cancelled status if the space is not already free
  if (spaceSubscription.space.paidTier !== 'free') {
    await prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        updatedAt: new Date(),
        updatedBy: userId,
        paidTier: 'cancelled'
      }
    });
  }

  // Always try to cancel the subscription
  await stripeClient.subscriptions.cancel(spaceSubscription.subscriptionId);
}
