import { stripeClient } from 'lib/subscription/stripe';
import { SUBSCRIPTION_PRODUCTS_RECORD } from 'lib/subscription/constants';

async function createStripeProducts() {
  for (const subscriptionProduct of Object.values(SUBSCRIPTION_PRODUCTS_RECORD)) {
    await stripeClient.products.create({
      name: subscriptionProduct.name,
      id: subscriptionProduct.id
    });
  }

  for (const subscriptionProduct of Object.values(SUBSCRIPTION_PRODUCTS_RECORD)) {
    for (const [period, price] of Object.entries(subscriptionProduct.pricing)) {
      await stripeClient.prices.create({
        unit_amount: price * 100, // in cents
        currency: 'usd',
        recurring: { interval: period === 'annual' ? 'year' : 'month' },
        product: subscriptionProduct.id
      });
    }
  }
}

createStripeProducts();
