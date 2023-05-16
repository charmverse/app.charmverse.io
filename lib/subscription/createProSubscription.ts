import { prisma } from '@charmverse/core';
import type Stripe from 'stripe';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import type { SubscriptionPeriod, SubscriptionUsage } from './constants';
import { SUBSCRIPTION_USAGE_RECORD } from './constants';
import { stripeClient } from './stripe';

export type PaymentDetails = {
  fullName: string;
  billingEmail: string;
  streetAddress: string;
};

export type CreateProSubscriptionRequest = PaymentDetails & {
  spaceId: string;
  paymentMethodId: string;
  usage: SubscriptionUsage;
  period: SubscriptionPeriod;
};

export type CreateProSubscriptionResponse = {
  clientSecret: string | null;
  paymentIntentStatus: Stripe.PaymentIntent.Status | null;
};

export async function createProSubscription({
  paymentMethodId,
  spaceId,
  period,
  usage,
  billingEmail,
  fullName
}: {
  usage: SubscriptionUsage;
  paymentMethodId: string;
  spaceId: string;
  period: SubscriptionPeriod;
} & PaymentDetails) {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      subscriptionId: true,
      domain: true,
      id: true
    }
  });

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  if (space.subscriptionId) {
    throw new InvalidStateError('Space already has a subscription');
  }

  // Create a customer
  const customer = await stripeClient.customers.create({
    name: fullName,
    payment_method: paymentMethodId,
    invoice_settings: { default_payment_method: paymentMethodId },
    email: billingEmail
  });

  const product = await stripeClient.products.retrieve(`pro-${usage}-${period}`);

  // In cent so multiplying by 100
  const amount = SUBSCRIPTION_USAGE_RECORD[usage].pricing[period] * (period === 'monthly' ? 1 : 12) * 100;

  // Create a subscription
  const subscription = await stripeClient.subscriptions.create({
    metadata: {
      usage,
      period,
      tier: 'pro',
      spaceId: space.id
    },
    customer: customer.id,
    items: [
      {
        price_data: {
          currency: 'USD',
          product: product.id,
          unit_amount: amount,
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

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

  await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      subscriptionId: subscription.id,
      paidTier: 'pro'
    }
  });

  return {
    paymentIntentStatus: paymentIntent?.status ?? null,
    clientSecret: paymentIntent?.client_secret ?? null
  };
}
