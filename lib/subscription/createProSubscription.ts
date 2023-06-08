import { ExternalServiceError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import log from 'loglevel';
import type { Stripe } from 'stripe';
import stripe from 'stripe';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import type { CreateSubscriptionRequest, ProSubscriptionResponse } from './interfaces';
import { stripeClient } from './stripe';

export async function createProSubscription({
  spaceId,
  period,
  productId,
  billingEmail,
  name,
  address,
  coupon = ''
}: {
  spaceId: string;
} & CreateSubscriptionRequest): Promise<ProSubscriptionResponse> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      domain: true,
      id: true,
      name: true
    }
  });

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  const spaceSubscription = await prisma.stripeSubscription.findFirst({
    where: {
      spaceId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const activeSpaceSubscription =
    spaceSubscription?.productId === productId &&
    spaceSubscription.period === period &&
    spaceSubscription.deletedAt === null;

  if (activeSpaceSubscription) {
    throw new InvalidStateError(
      `Space already has an active subscription with the id ${spaceSubscription.id} with the same product price`
    );
  }

  // Find an existing customer, otherwise create it
  const existingCustomer = spaceSubscription
    ? await stripeClient.customers.retrieve(spaceSubscription.customerId)
    : null;

  if (existingCustomer && !existingCustomer?.deleted) {
    await stripeClient.customers.update(existingCustomer.id, {
      metadata: {
        spaceId: space.id
      },
      address,
      name: name || space.name,
      email: billingEmail
    });
  }

  const customer =
    existingCustomer ||
    (await stripeClient.customers.create({
      metadata: {
        spaceId: space.id
      },
      address,
      name: name || space.name,
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
    // Case if user downgrades or upgrades or user has an expired subscription and purchases again
    if (
      (spaceSubscription?.productId !== productId || spaceSubscription.period !== period) &&
      spaceSubscription?.deletedAt === null
    ) {
      const oldSubscription = await stripeClient.subscriptions.retrieve(spaceSubscription.subscriptionId);
      subscription = await stripeClient.subscriptions.update(spaceSubscription.subscriptionId, {
        metadata: {
          productId,
          period,
          tier: 'pro',
          spaceId: space.id
        },
        coupon,
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        cancel_at_period_end: false,
        proration_behavior: 'create_prorations',
        items: [
          {
            id: oldSubscription.items.data[0].id,
            price: productPrice.id
          }
        ]
      });
      await prisma.stripeSubscription.update({
        where: {
          id: spaceSubscription.id
        },
        data: {
          period,
          productId,
          priceId: productPrice.id
        }
      });
    } else {
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
        coupon,
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });
    }
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
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent | null;

  return {
    subscriptionId: subscription.id,
    priceId: productPrice.id,
    productId,
    invoiceId: invoice.id,
    customerId: customer.id,
    paymentIntentId: paymentIntent?.id,
    paymentIntentStatus: paymentIntent?.status,
    clientSecret: paymentIntent?.client_secret || undefined
  };
}
