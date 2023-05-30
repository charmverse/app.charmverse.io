import { ExternalServiceError } from '@charmverse/core';
import { prisma } from '@charmverse/core/prisma-client';
import log from 'loglevel';
import type { Stripe } from 'stripe';
import stripe from 'stripe';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import type { CreateCryptoSubscriptionRequest } from './createCryptoSubscription';
import { stripeClient } from './stripe';

export type StripeSubscriptionresponse = {
  subscriptionId: string;
  priceId?: string;
  invoiceId: string;
  productId: string;
  customerId: string;
  paymentIntentId: string;
};

export async function createStripeSubscription({
  paymentMethodId,
  spaceId,
  period,
  productId,
  billingEmail,
  name,
  address
}: {
  spaceId: string;
} & CreateCryptoSubscriptionRequest): Promise<StripeSubscriptionresponse | null> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      domain: true,
      id: true,
      name: true,
      stripeSubscription: {
        where: {
          deletedAt: null
        },
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  const activeSpaceSubscription = space.stripeSubscription?.find(
    (sub) => sub.productId === productId && sub.period === period
  );

  if (activeSpaceSubscription) {
    throw new InvalidStateError('Space already has a subscription');
  }

  // Find an existing customer, otherwise create it
  const existingCustomers = await stripeClient.customers.list({ email: billingEmail });
  const existingCustomer = existingCustomers?.data.find((customer) => customer.metadata.spaceId === space.id);
  const customer =
    existingCustomer ||
    (await stripeClient.customers.create({
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
      metadata: {
        spaceId: space.id
      },
      address,
      name,
      email: billingEmail
    }));

  const stripePeriod = period === 'monthly' ? 'month' : 'year';

  // Get all prices for the given product. Usually there will be two prices, one for monthly and one for yearly
  const { data: prices } = await stripeClient.prices.list({
    product: productId,
    type: 'recurring',
    active: true
  });

  if (prices?.length === 0) {
    throw new InvalidStateError(`No prices found in Stripe for the product ${productId}`);
  }

  const productPrice = prices.find((price) => price.recurring?.interval === stripePeriod);

  if (!productPrice) {
    throw new InvalidStateError(`No price  ${productId}`);
  }

  let subscription;
  try {
    subscription = await stripeClient.subscriptions.create({
      metadata: {
        productId,
        period,
        tier: 'pro',
        spaceId: space.id
      },
      customer: customer.id,
      items: [
        {
          price: productPrice.id
        }
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        // payment_method_types: ['ach_credit_transfer', 'card', 'cashapp'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });
  } catch (err: any) {
    log.error(`[stripe]: Failed to create subscription. ${err.message}`, {
      spaceId,
      period,
      billingEmail,
      errorType: err instanceof stripe.errors.StripeError ? err.type : undefined,
      errorCode: err instanceof stripe.errors.StripeError ? err.code : undefined
    });
  }

  if (!subscription) {
    throw new ExternalServiceError('Failed to create subscription');
  }

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

  return {
    subscriptionId: subscription.id,
    priceId: productPrice.id,
    productId,
    invoiceId: invoice.id,
    customerId: customer.id,
    paymentIntentId: paymentIntent.id
  };
}
