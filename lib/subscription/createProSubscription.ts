import { ExternalServiceError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import log from 'loglevel';
import type { Stripe } from 'stripe';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import { communityProduct } from './constants';
import type { CreateProSubscriptionRequest, ProSubscriptionResponse } from './interfaces';
import { stripeClient } from './stripe';

export async function createProSubscription({
  spaceId,
  period,
  blockQuota,
  billingEmail,
  name,
  address,
  coupon = ''
}: {
  spaceId: string;
} & CreateProSubscriptionRequest): Promise<ProSubscriptionResponse> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      domain: true,
      id: true,
      name: true
    }
  });

  const productId = communityProduct.id;

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  const spaceSubscription = await prisma.stripeSubscription.findFirst({
    where: {
      spaceId,
      deletedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (spaceSubscription) {
    throw new InvalidStateError(`Space already has an active subscription with the id ${spaceSubscription.id}`);
  }

  const pendingStripeSubscription = await stripeClient.subscriptions.search({
    query: `metadata['spaceId']:'${spaceId}'`,
    expand: ['data.customer']
  });

  const existingStripeSubscription: Stripe.Subscription | undefined = pendingStripeSubscription.data?.[0];

  const existingStripeCustomer = pendingStripeSubscription.data?.find((sub) => {
    const _customer = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
    return _customer.deleted !== true && (sub.status === 'trialing' || sub.status === 'incomplete');
  })?.customer as Stripe.Customer | undefined;

  // A failed payment will already have a customer & subscription
  if (existingStripeCustomer && !existingStripeCustomer?.deleted) {
    await stripeClient.customers.update(existingStripeCustomer.id, {
      metadata: {
        spaceId: space.id
      },
      name: name || space.name,
      ...(address && { address }),
      ...(billingEmail && { email: billingEmail })
    });
  }

  const customer =
    existingStripeCustomer ||
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
    throw new InvalidStateError(`No prices found in Stripe for the product ${productId} and space ${spaceId}`);
  }

  const productPrice = prices.find(
    (price) =>
      price.recurring?.interval === stripePeriod && (price.unit_amount || 0) / 100 === communityProduct.pricing[period]
  );

  if (!productPrice) {
    throw new InvalidStateError(`No price for product ${productId} and space ${spaceId}`);
  }

  let subscription: Stripe.Subscription | undefined;
  try {
    // Case when the user is updating his subscription in checkout
    if (
      existingStripeSubscription &&
      (existingStripeSubscription.status === 'trialing' || existingStripeSubscription.status === 'incomplete')
    ) {
      subscription = await stripeClient.subscriptions.update(existingStripeSubscription.id, {
        metadata: {
          productId,
          period,
          tier: 'pro',
          spaceId: space.id
        },
        items: [
          {
            id: existingStripeSubscription.items.data[0].id,
            price: productPrice.id,
            quantity: blockQuota
          }
        ],
        coupon,
        expand: ['latest_invoice.payment_intent']
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
            price: productPrice.id,
            quantity: blockQuota
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
  } catch (error: any) {
    log.error(`[stripe]: Failed to create subscription. ${error.message}`, {
      spaceId,
      period,
      billingEmail,
      error
    });
  }

  if (!subscription) {
    throw new ExternalServiceError('Failed to create subscription');
  }

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent | null;

  if (!paymentIntent?.client_secret) {
    throw new ExternalServiceError('Failed to create subscription. The client secret is missing.');
  }

  return {
    subscriptionId: subscription.id,
    priceId: productPrice.id,
    productId,
    blockQuota,
    invoiceId: invoice.id,
    customerId: customer.id,
    paymentIntentId: paymentIntent.id,
    paymentIntentStatus: paymentIntent.status,
    clientSecret: paymentIntent.client_secret
  };
}
