import { prisma } from '@charmverse/core/prisma-client';
import log from 'loglevel';
import type { Stripe } from 'stripe';
import stripe from 'stripe';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import type { SubscriptionPeriod, SubscriptionProductId } from './constants';
import { stripeClient } from './stripe';

export type CreateProSubscriptionRequest = {
  paymentMethodId: string;
  productId: SubscriptionProductId;
  period: SubscriptionPeriod;
  billingEmail: string;
};

export type CreateProSubscriptionResponse = {
  clientSecret: string | null;
  paymentIntentStatus: Stripe.PaymentIntent.Status | null;
};

export async function createProSubscription({
  paymentMethodId,
  spaceId,
  period,
  productId,
  billingEmail
}: {
  userId: string;
  productId: SubscriptionProductId;
  paymentMethodId: string;
  spaceId: string;
  period: SubscriptionPeriod;
  billingEmail: string;
}): Promise<CreateProSubscriptionResponse> {
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

  const activeSpaceSubscription = space?.stripeSubscription[0];

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  if (activeSpaceSubscription?.status === 'active') {
    throw new InvalidStateError('Space already has an active subscription');
  } else if (activeSpaceSubscription?.status === 'pending') {
    throw new InvalidStateError(
      'Space already has a pending subscription. Please wait for the payment to be processed.'
    );
  }

  // Find an existing customer, otherwise create it
  const existingCustomer = await stripeClient.customers.list({
    email: billingEmail,
    limit: 1
  });

  const customer =
    existingCustomer.data.length !== 0
      ? existingCustomer.data[0]
      : await stripeClient.customers.create({
          metadata: {
            spaceId: space.id
          },
          name: space.name,
          payment_method: paymentMethodId,
          invoice_settings: { default_payment_method: paymentMethodId },
          email: billingEmail
        });

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

  try {
    // Create a subscription
    const subscription = await stripeClient.subscriptions.create({
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
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      paymentIntentStatus: paymentIntent?.status ?? null,
      clientSecret: paymentIntent?.client_secret ?? null
    };
  } catch (err: any) {
    log.error(`[stripe]: Failed to create subscription. ${err.message}`, {
      spaceId,
      period,
      billingEmail,
      errorType: err instanceof stripe.errors.StripeError ? err.type : undefined,
      errorCode: err instanceof stripe.errors.StripeError ? err.code : undefined
    });
    return {
      clientSecret: null,
      paymentIntentStatus: null
    };
  }
}
