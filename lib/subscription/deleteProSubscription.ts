import { prisma } from '@charmverse/core/prisma-client';
import log from 'loglevel';
import stripe from 'stripe';

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

  await prisma.stripeSubscription.delete({
    where: {
      subscriptionId: spaceSubscription.subscriptionId,
      spaceId
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

  try {
    await stripeClient.subscriptions.cancel(spaceSubscription.subscriptionId);
  } catch (err: any) {
    log.error(`[stripe]: Failed to cancel subscription. ${err.message}`, {
      spaceId,
      errorType: err instanceof stripe.errors.StripeError ? err.type : undefined,
      errorCode: err instanceof stripe.errors.StripeError ? err.code : undefined
    });
  }
}
