import { InvalidStateError } from '@packages/nextjs/errors';

import type { SubscriptionPeriod } from './constants';
import { stripeClient } from './stripe';

export async function getCommunityPrice(productId: string, period: SubscriptionPeriod) {
  const stripePeriod = period === 'monthly' ? 'month' : 'year';

  const { data: prices } = await stripeClient.prices.list({
    product: productId,
    type: 'recurring',
    active: true
  });

  if (prices?.length === 0) {
    throw new InvalidStateError(`No prices found in Stripe for the product ${productId}`);
  }

  const productPrice = prices.find((price) => price.recurring?.interval === stripePeriod);

  if (!productPrice) {
    throw new InvalidStateError(`No price for product ${productId}`);
  }

  return productPrice;
}
