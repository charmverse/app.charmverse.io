import { InvalidStateError } from '@packages/nextjs/errors';

import type { SubscriptionPeriod } from './constants';
import { communityProduct } from './constants';
import { getActiveSpaceSubscription } from './getActiveSpaceSubscription';
import { getCommunityPrice } from './getProductPrice';
import { stripeClient } from './stripe';

export type UpgradeSubscriptionRequest = {
  blockQuota: number;
  period: SubscriptionPeriod;
};

export async function upgradeProSubscription({
  spaceId,
  payload
}: {
  spaceId: string;
  payload: UpgradeSubscriptionRequest;
}) {
  const spaceSubscriptionWithDetails = await getActiveSpaceSubscription({ spaceId });

  if (!spaceSubscriptionWithDetails) {
    throw new InvalidStateError(`Missing subscription for space ${spaceId}`);
  }

  const productId = communityProduct.id;
  // Get all prices for the given product. Usually there will be two prices, one for monthly and one for yearly
  const productPrice = await getCommunityPrice(productId, payload.period);

  const subscription = await stripeClient.subscriptions.retrieve(spaceSubscriptionWithDetails.subscriptionId);

  await stripeClient.subscriptions.update(subscription.id, {
    cancel_at_period_end: false,
    proration_behavior: 'always_invoice',
    items: [
      {
        id: subscription.items.data[0].id,
        price: productPrice.id,
        quantity: payload.blockQuota
      }
    ]
  });
}
