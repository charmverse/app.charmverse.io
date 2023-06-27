import { ExternalServiceError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import log from 'loglevel';
import type { Stripe } from 'stripe';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import { communityProduct } from './constants';
import type { CreateProSubscriptionRequest, ProSubscriptionResponse, StripeMetadataKeys } from './interfaces';
import { stripeClient } from './stripe';

export async function createProSubscription({
  spaceId,
  period,
  blockQuota,
  billingEmail,
  name,
  address,
  coupon = '',
  freeTrial
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
    query: `metadata['spaceId']:'${spaceId}' AND status:"incomplete"`,
    expand: ['data.customer']
  });

  const existingStripeSubscription: Stripe.Subscription | undefined = pendingStripeSubscription.data?.find(
    (sub) =>
      (sub.customer as Stripe.Customer | Stripe.DeletedCustomer)?.deleted !== true &&
      (sub.customer as Stripe.Customer).metadata.spaceId === spaceId
  );

  const existingStripeCustomer = existingStripeSubscription?.customer as Stripe.Customer | undefined;

  // A failed payment will already have a customer & subscription
  if (existingStripeCustomer && !existingStripeCustomer?.deleted) {
    await stripeClient.customers.update(existingStripeCustomer.id, {
      metadata: {
        spaceId: space.id,
        domain: space.domain
      } as StripeMetadataKeys,
      name: name || space.name,
      ...(address && { address }),
      ...(billingEmail && { email: billingEmail })
    });
  }

  const customer =
    existingStripeCustomer ||
    (await stripeClient.customers.create({
      metadata: {
        spaceId: space.id,
        domain: space.domain
      } as StripeMetadataKeys,
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
    if (existingStripeSubscription && existingStripeSubscription.status === 'incomplete') {
      await stripeClient.subscriptions.del(existingStripeSubscription.id);
    }

    subscription = await stripeClient.subscriptions.create({
      metadata: {
        productId,
        period,
        tier: 'pro',
        spaceId: space.id
      },
      trial_period_days: freeTrial ? communityProduct.trial : undefined,
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

  return {
    subscriptionId: subscription.id,
    priceId: productPrice.id,
    productId,
    blockQuota,
    invoiceId: invoice.id,
    customerId: customer.id,
    paymentIntentId: paymentIntent?.id,
    paymentIntentStatus: paymentIntent?.status,
    clientSecret: paymentIntent?.client_secret
  };
}
