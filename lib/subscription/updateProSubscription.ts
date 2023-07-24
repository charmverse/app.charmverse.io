import { prisma } from '@charmverse/core/prisma-client';
import type Stripe from 'stripe';

import { InvalidStateError } from 'lib/middleware';

import type { SubscriptionStatusType } from './constants';
import type { SpaceSubscriptionWithStripeData } from './getActiveSpaceSubscription';
import { stripeClient } from './stripe';

export type UpdateSubscriptionRequest = {
  status?: Extract<SubscriptionStatusType, 'active' | 'cancel_at_end'>;
  billingEmail?: SpaceSubscriptionWithStripeData['billingEmail'];
};

export async function updateProSubscription({
  spaceId,
  payload
}: {
  spaceId: string;
  payload: UpdateSubscriptionRequest;
}) {
  const { billingEmail, status } = payload;

  const spaceSubscription = await prisma.stripeSubscription.findFirst({
    where: {
      spaceId,
      deletedAt: null
    }
  });

  if (!spaceSubscription) {
    throw new InvalidStateError(`No subscription to update for space ${spaceId}`);
  }

  const subscriptionId = spaceSubscription.subscriptionId;

  const stripeSubscription = await stripeClient.subscriptions.retrieve(subscriptionId, {
    expand: ['customer']
  });

  if (stripeSubscription.metadata.spaceId !== spaceId) {
    throw new InvalidStateError(`Subscription ${subscriptionId} is not related to space ${spaceId}`);
  }

  const stripeCustomer = stripeSubscription.customer as Stripe.Customer;

  if (stripeCustomer.deleted) {
    throw new InvalidStateError(`Can't update the subscription of a deleted customer ${stripeCustomer.id}`);
  }

  if (stripeSubscription?.status !== 'active') {
    throw new InvalidStateError(`Subscription ${stripeSubscription.id} is not active`);
  }

  if (billingEmail) {
    await stripeClient.customers.update(stripeCustomer.id, {
      email: billingEmail
    });
  }

  if (status === 'cancel_at_end') {
    await stripeClient.subscriptions.update(stripeSubscription.id, {
      cancel_at_period_end: true
    });
  } else if (status === 'active') {
    await stripeClient.subscriptions.update(stripeSubscription.id, {
      cancel_at_period_end: false
    });
  }
}
