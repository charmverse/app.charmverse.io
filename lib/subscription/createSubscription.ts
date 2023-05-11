import { prisma } from '@charmverse/core';
import type { SubscriptionTier } from '@charmverse/core/prisma';
import Stripe from 'stripe';

import type { SubscriptionPeriod, SubscriptionUsage } from './utils';
import { SubscriptionUsageRecord } from './utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15'
});

export async function createSubscription({
  paymentMethodId,
  spaceId,
  spaceDomain,
  period,
  usage,
  tier = 'pro'
}: {
  usage: SubscriptionUsage;
  paymentMethodId: string;
  spaceId: string;
  spaceDomain: string;
  period: SubscriptionPeriod;
  tier?: Exclude<SubscriptionTier, 'free'>;
}) {
  // Create a customer
  const customer = await stripe.customers.create({
    name: `${spaceDomain} - ${spaceId}`,
    payment_method: paymentMethodId,
    invoice_settings: { default_payment_method: paymentMethodId }
  });

  const product = await stripe.products.retrieve(`${tier}-${usage}-${period}`);

  // Create a subscription
  const subscription = await stripe.subscriptions.create({
    metadata: {
      usage,
      period,
      tier
    },

    customer: customer.id,
    items: [
      {
        price_data: {
          currency: 'USD',
          product: product.id,
          unit_amount: SubscriptionUsageRecord[usage].pricing[period] * (period === 'monthly' ? 1 : 12) * 100,
          recurring: {
            interval: period === 'monthly' ? 'month' : 'year'
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

  await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      subscriptionId: subscription.id
    }
  });
  const paymentIntent = (subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent;

  return {
    paymentIntentStatus: paymentIntent?.status ?? null,
    clientSecret: paymentIntent?.client_secret ?? null
  };
}
