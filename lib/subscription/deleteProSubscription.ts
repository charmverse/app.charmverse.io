import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import { stripeClient } from './stripe';

export async function deleteProSubscription({ spaceId, userId }: { spaceId: string; userId: string }) {
  const spaceSubscription = await prisma.stripeSubscription.findFirst({
    where: {
      spaceId,
      deletedAt: null
    }
  });

  if (!spaceSubscription) {
    throw new NotFoundError(`Subscription not found for space ${spaceId}`);
  }

  const subscription = await stripeClient.subscriptions.retrieve(spaceSubscription.subscriptionId);

  if (subscription.status !== 'active') {
    throw new InvalidStateError(`Subscription ${subscription.id} is not active`);
  }

  await prisma.stripeSubscription.update({
    where: {
      subscriptionId: spaceSubscription.subscriptionId,
      spaceId
    },
    data: {
      deletedAt: new Date(),
      status: 'cancelled'
    }
  });

  await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      updatedAt: new Date(),
      updatedBy: userId,
      paidTier: 'free'
    }
  });

  await stripeClient.subscriptions.cancel(spaceSubscription.subscriptionId);
}
