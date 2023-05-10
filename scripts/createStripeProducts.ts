import { SubscriptionUsageRecord } from 'lib/payment/utils';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15'
});

async function createStripeProducts() {
  for (const usage of Object.keys(SubscriptionUsageRecord)) {
    for (const period of ["monthly", 'annual']) {
      await stripe.products.create({
        name: `Pro - ${usage} - ${period} Subscription`,
        id: `pro-${usage}-${period}`,
      })
    }
  }
}

createStripeProducts();
