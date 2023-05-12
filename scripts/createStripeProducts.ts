import { stripeClient } from 'lib/subscription/stripe';
import { SUBSCRIPTION_USAGE_RECORD } from 'lib/subscription/utils';

async function createStripeProducts() {
  for (const usage of Object.keys(SUBSCRIPTION_USAGE_RECORD)) {
    for (const period of ["monthly", 'annual']) {
      await stripeClient.products.create({
        name: `Pro - ${usage} - ${period} Subscription`,
        id: `pro-${usage}-${period}`,
      })
    }
  }
}

createStripeProducts();
