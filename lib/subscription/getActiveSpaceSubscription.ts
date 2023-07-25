import type { StripeSubscription } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type Stripe from 'stripe';

import type { SubscriptionFieldsFromStripe } from './mapStripeFields';
import { mapStripeFields } from './mapStripeFields';
import { stripeClient } from './stripe';

export type SpaceSubscriptionRequest = {
  spaceId: string;
  returnUrl?: string;
};

export type SpaceSubscriptionWithStripeData = StripeSubscription & SubscriptionFieldsFromStripe;

export const subscriptionExpandFields = ['customer', 'default_payment_method'];

export async function getActiveSpaceSubscription({
  spaceId,
  returnUrl,
  requestCustomerPortal
}: SpaceSubscriptionRequest & { requestCustomerPortal?: boolean }): Promise<SpaceSubscriptionWithStripeData | null> {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId,
      deletedAt: null
    },
    select: {
      stripeSubscription: {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        },
        where: {
          deletedAt: null
        }
      }
    }
  });

  const activeSpaceSubscription = space?.stripeSubscription?.[0];

  if (!activeSpaceSubscription) {
    return null;
  }

  const subscriptionInStripe = await stripeClient.subscriptions.retrieve(activeSpaceSubscription.subscriptionId, {
    // Never pass the values inline. Use subscriptionExpandFields variable instead so we can unit test its value.
    expand: subscriptionExpandFields
  });

  const stripeData = mapStripeFields({
    spaceId,
    subscription: subscriptionInStripe as Stripe.Subscription & { customer: Stripe.Customer }
  });

  if (stripeData.paymentMethod && requestCustomerPortal && returnUrl) {
    const portal = await stripeClient.billingPortal.sessions.create({
      customer: (subscriptionInStripe.customer as Stripe.Customer).id,
      return_url: returnUrl
    });
    stripeData.paymentMethod.updateUrl = portal.url;
  }

  if (stripeData.status === 'cancelled') {
    return null;
  }

  const enrichedSubscriptionData: StripeSubscription & SubscriptionFieldsFromStripe = {
    ...activeSpaceSubscription,
    ...stripeData
  };

  return enrichedSubscriptionData;
}
