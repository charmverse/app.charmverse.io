import { prisma } from '@charmverse/core/prisma-client';
import { InvalidStateError, NotFoundError } from '@packages/nextjs/errors';
import type { Stripe } from 'stripe';

import { communityProduct } from './constants';
import { getActiveSpaceSubscription } from './getActiveSpaceSubscription';
import { getCouponDetails } from './getCouponDetails';
import { getCommunityPrice } from './getProductPrice';
import type { CreateProSubscriptionRequest, ProSubscriptionResponse, StripeMetadataKeys } from './interfaces';
import { stripeClient } from './stripe';

export async function createProSubscription({
  spaceId,
  period,
  blockQuota,
  billingEmail,
  name,
  address,
  coupon
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

  const spaceSubscriptionWithDetails = await getActiveSpaceSubscription({ spaceId });

  if (spaceSubscriptionWithDetails?.status === 'active') {
    throw new InvalidStateError(
      `Space already has an active subscription with the id ${spaceSubscriptionWithDetails.id}`
    );
  }

  const existingCustomer = await stripeClient.customers.search({
    query: `metadata['spaceId']:'${spaceId}'`
  });

  let existingStripeSubscription: Stripe.Subscription | undefined;
  if (existingCustomer.data?.[0]?.id) {
    const stripeSubscriptions = await stripeClient.subscriptions.list({
      status: 'incomplete',
      customer: existingCustomer.data?.[0]?.id
    });

    existingStripeSubscription = stripeSubscriptions.data?.find((sub) => sub.metadata.spaceId === spaceId);
  }

  const existingStripeCustomer = existingCustomer?.data.find((cus) => !cus.deleted);

  // A failed payment will already have a customer & subscription
  if (existingStripeCustomer && !existingStripeCustomer?.deleted) {
    await stripeClient.customers.update(existingStripeCustomer.id, {
      metadata: {
        spaceId,
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
        spaceId,
        domain: space.domain
      } as StripeMetadataKeys,
      address,
      name: name || space.name,
      email: billingEmail
    }));

  // Get all prices for the given product. Usually there will be two prices, one for monthly and one for yearly
  const productPrice = await getCommunityPrice(productId, period);

  // Case when the user is updating his subscription in checkout
  if (existingStripeSubscription && existingStripeSubscription.status === 'incomplete') {
    await stripeClient.subscriptions.del(existingStripeSubscription.id);
  }

  let promoCodeData;
  if (coupon) {
    promoCodeData = await getCouponDetails(coupon);
  }

  const subscription = await stripeClient.subscriptions.create({
    metadata: {
      productId,
      period,
      tier: 'community',
      spaceId
    },
    trial_period_days: undefined,
    customer: customer.id,
    items: [
      {
        price: productPrice.id,
        quantity: blockQuota
      }
    ],
    ...(promoCodeData && {
      [promoCodeData.type]: promoCodeData.id
    }),
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    trial_settings: undefined,
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent | null;

  return {
    subscriptionId: subscription.id,
    priceId: productPrice.id,
    productId,
    blockQuota,
    invoiceId: invoice.id,
    customerId: customer.id,
    email: customer.email || undefined,
    paymentIntent: paymentIntent
      ? {
          subscriptionId: subscription.id,
          paymentIntentId: paymentIntent.id,
          paymentIntentStatus: paymentIntent.status,
          clientSecret: paymentIntent.client_secret as string,
          subTotalPrice: ((subscription.latest_invoice as Stripe.Invoice).subtotal || 0) / 100,
          totalPrice: ((subscription.latest_invoice as Stripe.Invoice).total || 0) / 100,
          coupon
        }
      : undefined
  };
}
