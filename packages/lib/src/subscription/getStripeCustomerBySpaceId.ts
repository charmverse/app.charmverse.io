import type Stripe from 'stripe';

import { stripeClient } from './stripe';

export async function getStripeCustomerBySpaceId({ spaceId }: { spaceId: string }): Promise<Stripe.Customer | null> {
  return stripeClient.customers
    .search({
      query: `metadata["spaceId"]:"${spaceId}"`
    })
    .then((results) => {
      return results.data[0];
    });
}
