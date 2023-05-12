import { prisma } from '@charmverse/core';
import type { SubscriptionTier } from '@charmverse/core/prisma';
import type Stripe from 'stripe';

import { stripeClient } from './stripe';
import type { SubscriptionPeriod, SubscriptionUsage } from './utils';
import { SUBSCRIPTION_USAGE_RECORD } from './utils';

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
  const customer = await stripeClient.customers.create({
    name: `${spaceDomain} - ${spaceId}`,
    payment_method: paymentMethodId,
    invoice_settings: { default_payment_method: paymentMethodId }
  });

  const product = await stripeClient.products.retrieve(`${tier}-${usage}-${period}`);

  // Create a subscription
  const subscription = await stripeClient.subscriptions.create({
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
          unit_amount: SUBSCRIPTION_USAGE_RECORD[usage].pricing[period] * (period === 'monthly' ? 1 : 12) * 100,
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
      subscriptionId: subscription.id,
      paidTier: tier
    }
  });

  const paymentIntent = (subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent;

  return {
    paymentIntentStatus: paymentIntent?.status ?? null,
    clientSecret: paymentIntent?.client_secret ?? null
  };
}
