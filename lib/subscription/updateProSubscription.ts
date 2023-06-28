import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import type { SubscriptionStatusType } from './constants';
import type { SpaceSubscriptionWithStripeData } from './getActiveSpaceSubscription';
import { getActiveSpaceSubscription } from './getActiveSpaceSubscription';
import { stripeClient } from './stripe';

export type UpdateSubscriptionRequest = Partial<
  Pick<SpaceSubscriptionWithStripeData, 'status' | 'billingEmail'> & {
    status?: Extract<SubscriptionStatusType, 'active' | 'cancel_at_end'>;
  }
>;
export async function updateProSubscription({
  spaceId,
  payload
}: {
  spaceId: string;
  payload: UpdateSubscriptionRequest;
}) {
  const { billingEmail, status } = payload;

  const subscription = await getActiveSpaceSubscription({
    spaceId
  });

  if (!subscription) {
    throw new NotFoundError(`Subscription not found for space ${spaceId}`);
  }
  if (subscription.status === 'cancelled') {
    throw new InvalidStateError(`Subscription ${subscription.id} is not active`);
  }

  if (status === 'cancel_at_end') {
    await stripeClient.subscriptions.update(subscription.subscriptionId, {
      cancel_at_period_end: true
    });
  } else if (status === 'active') {
    await stripeClient.subscriptions.update(subscription.subscriptionId, {
      cancel_at_period_end: false
    });
  }

  if (billingEmail) {
    await stripeClient.customers.update(subscription.customerId, {
      email: billingEmail
    });
  }
}
