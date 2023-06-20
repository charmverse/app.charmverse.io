import { ExternalServiceError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import log from 'loglevel';
import type { Stripe } from 'stripe';

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
      spaceId,
      deletedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const activeSpaceSubscription = spaceSubscription?.productId === productId && spaceSubscription.period === period;

  if (activeSpaceSubscription) {
    throw new InvalidStateError(
      `Space already has an active subscription with the id ${spaceSubscription.id} with the same product price`
    );
  }

  // Find an existing customer, otherwise create it
  const existingSpaceCustomer = spaceSubscription
    ? await stripeClient.customers.retrieve(spaceSubscription.customerId)
    : null;

  if (existingSpaceCustomer && !existingSpaceCustomer?.deleted) {
    await stripeClient.customers.update(existingSpaceCustomer.id, {
      metadata: {
        spaceId: space.id
      },
      address,
      name: name || space.name,
      email: billingEmail
    });
  }

  const pendingStripeSubscription = await stripeClient.subscriptions.search({
    query: `metadata['spaceId']:'${spaceId}'`,
    expand: ['data.customer']
  });

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
      address,
      name: name || space.name,
      email: billingEmail
    });
  }

  const customer =
    existingSpaceCustomer ||
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
    throw new InvalidStateError(`No prices found in Stripe for the product ${productId}`);
  }

  const productPrice = prices.find((price) => price.recurring?.interval === stripePeriod);

  if (!productPrice) {
    throw new InvalidStateError(`No price  ${productId}`);
  }

  let subscription: Stripe.Subscription | undefined;
  try {
    // Case if user downgrades or upgrades or user has an expired subscription and purchases again
    if (spaceSubscription && (spaceSubscription.productId !== productId || spaceSubscription.period !== period)) {
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
          priceId: productPrice.id,
          deletedAt: null
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
    invoiceId: invoice.id,
    customerId: customer.id,
    paymentIntentId: paymentIntent?.id,
    paymentIntentStatus: paymentIntent?.status,
    clientSecret: paymentIntent?.client_secret || undefined
  };
}
