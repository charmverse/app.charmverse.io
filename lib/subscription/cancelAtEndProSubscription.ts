import { prisma } from '@charmverse/core/prisma-client';
import log from 'loglevel';
import stripe from 'stripe';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import { stripeClient } from './stripe';

export async function cancelAtEndProSubscription({ spaceId }: { spaceId: string }) {
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

  try {
    await stripeClient.subscriptions.update(spaceSubscription.subscriptionId, {
      cancel_at_period_end: true
    });
  } catch (err: any) {
    log.error(`[stripe]: Failed to cancel_at_period_end subscription. ${err.message}`, {
      spaceId,
      errorType: err instanceof stripe.errors.StripeError ? err.type : undefined,
      errorCode: err instanceof stripe.errors.StripeError ? err.code : undefined
    });
  }

  await prisma.stripeSubscription.update({
    where: {
      id: spaceSubscription.id
    },
    data: {
      status: 'cancelAtEnd'
    }
  });
}
