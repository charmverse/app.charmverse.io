import type { StripeSubscription } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { DeprecatedFreeTrial } from '@packages/lib/subscription/constants';
import type Stripe from 'stripe';

import type { SubscriptionFieldsFromStripe } from './mapStripeFields';
import { mapStripeFields } from './mapStripeFields';
import { stripeClient } from './stripe';

export type SpaceSubscriptionRequest = {
  spaceId: string;
};

export type SpaceSubscriptionWithStripeData = StripeSubscription & SubscriptionFieldsFromStripe;

export const subscriptionExpandFields = ['customer', 'default_payment_method'];

export async function getActiveSpaceSubscription({
  spaceId
}: SpaceSubscriptionRequest): Promise<SpaceSubscriptionWithStripeData | null> {
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
    subscription: subscriptionInStripe as Stripe.Subscription & {
      customer: Stripe.Customer;
      default_payment_method: Stripe.PaymentMethod;
    }
  });

  // if user still has a deprecated free trial, we don't want to show it as active, just ignore it
  if (stripeData.status === 'cancelled' || stripeData.status === DeprecatedFreeTrial) {
    return null;
  }

  const enrichedSubscriptionData: StripeSubscription & SubscriptionFieldsFromStripe = {
    ...activeSpaceSubscription,
    ...stripeData
  };

  return enrichedSubscriptionData;
}
