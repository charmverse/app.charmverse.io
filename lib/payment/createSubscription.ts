import type { SubscriptionTier } from '@charmverse/core/dist/cjs/prisma';
import Stripe from 'stripe';

import type { Usage } from './utils';
import { UsageRecord } from './utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15'
});

export async function createSubscription({
  paymentMethodId,
  spaceId,
  spaceDomain,
  monthly,
  usage,
  tier = 'pro'
}: {
  usage: Usage;
  paymentMethodId: string;
  spaceId: string;
  spaceDomain: string;
  monthly: boolean;
  tier?: Exclude<SubscriptionTier, 'free'>;
}) {
  // Create a customer
  const customer = await stripe.customers.create({
    name: `${spaceDomain} - ${spaceId}`,
    payment_method: paymentMethodId,
    invoice_settings: { default_payment_method: paymentMethodId }
  });

  const product = await stripe.products.retrieve(`${tier}-${monthly ? 'monthly' : 'annual'}-${usage}`);

  // Create a subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [
      {
        price_data: {
          currency: 'USD',
          product: product.id,
          unit_amount: UsageRecord[usage].pricing,
          recurring: {
            interval: monthly ? 'month' : 'year'
          }
        }
      }
    ],
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription'
    },
    expand: ['latest_invoice.payment_intent']
  });

  return {
    clientSecret: ((subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent).client_secret
  };
}
