import { stripeClient } from 'lib/subscription/stripe';
import { SUBSCRIPTION_PRODUCTS_RECORD } from 'lib/subscription/constants';

async function createStripeProducts() {
  for (const subscriptionProduct of Object.values(SUBSCRIPTION_PRODUCTS_RECORD)) {
    await stripeClient.products.create({
      name: subscriptionProduct.name,
      id: subscriptionProduct.id,
    })
  }
}

createStripeProducts();
