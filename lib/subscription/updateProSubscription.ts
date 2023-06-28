import type Stripe from 'stripe';

import { InvalidStateError } from 'lib/middleware';

import type { SubscriptionStatusType } from './constants';
import type { SpaceSubscriptionWithStripeData } from './getActiveSpaceSubscription';
import { getActiveSpaceSubscription } from './getActiveSpaceSubscription';
import { stripeClient } from './stripe';

export type UpdateSubscriptionRequest = Partial<
  Pick<SpaceSubscriptionWithStripeData, 'status' | 'billingEmail' | 'coupon' | 'subscriptionId'> & {
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
  const { billingEmail, status, coupon } = payload;

  const stripeSubscription = await stripeClient.subscriptions.search({
    query: `metadata['spaceId']:'${spaceId}'`,
    expand: ['data.customer']
  });

  const existingStripeSubscription: Stripe.Subscription | undefined = stripeSubscription.data?.find(
    (sub) =>
      (sub.customer as Stripe.Customer | Stripe.DeletedCustomer)?.deleted !== true &&
      (sub.customer as Stripe.Customer).metadata.spaceId === spaceId
  );

  const existingStripeCustomer =
    typeof existingStripeSubscription?.customer !== 'string' ? existingStripeSubscription?.customer : undefined;

  if (existingStripeSubscription && existingStripeCustomer) {
    if (billingEmail && !existingStripeCustomer.deleted) {
      await stripeClient.customers.update(existingStripeCustomer.id, {
        email: billingEmail
      });
    }

    if (coupon) {
      await stripeClient.subscriptions.update(existingStripeSubscription.id, {
        coupon
      });
    }

    if (status === 'cancel_at_end') {
      await stripeClient.subscriptions.update(existingStripeSubscription.id, {
        cancel_at_period_end: true
      });
    } else if (status === 'active') {
      await stripeClient.subscriptions.update(existingStripeSubscription.id, {
        cancel_at_period_end: false
      });
    }
  }

  const subscription = await getActiveSpaceSubscription({
    spaceId
  });

  if (subscription?.status === 'cancelled') {
    throw new InvalidStateError(`Subscription ${subscription.id} is not active`);
  }
}
