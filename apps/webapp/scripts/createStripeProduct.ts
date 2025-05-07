import { stripeClient } from 'lib/subscription/stripe';
import { communityProduct } from 'lib/subscription/constants';

async function createStripeProduct() {
  await stripeClient.products.create({
    name: communityProduct.name,
    id: communityProduct.id
  });

  for (const [period, price] of Object.entries(communityProduct.pricing)) {
    await stripeClient.prices.create({
      unit_amount: price * 100, // in cents
      currency: 'usd',
      recurring: { interval: period === 'annual' ? 'year' : 'month' },
      product: communityProduct.id
    });
  }
}

createStripeProduct();
