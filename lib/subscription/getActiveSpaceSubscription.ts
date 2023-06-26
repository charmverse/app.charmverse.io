import type { StripeSubscription } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type Stripe from 'stripe';

import type { SubscriptionFieldsFromStripe } from './mapStripeFields';
import { mapStripeFields } from './mapStripeFields';
import { stripeClient } from './stripe';

export type SpaceSubscriptionWithStripeData = StripeSubscription & SubscriptionFieldsFromStripe;

export async function getActiveSpaceSubscription({
  spaceId
}: {
  spaceId: string;
}): Promise<SpaceSubscriptionWithStripeData | null> {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      stripeSubscription: {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  const activeSpaceSubscription = space?.stripeSubscription[0];

  if (!activeSpaceSubscription) {
    return null;
  }

  const subscriptionInStripe = await stripeClient.subscriptions.retrieve(activeSpaceSubscription.subscriptionId, {
    expand: ['customer', 'default_payment_method']
  });

  const stripeData = mapStripeFields({
    spaceId,
    subscription: subscriptionInStripe as Stripe.Subscription & { customer: Stripe.Customer }
  });

  if (stripeData.status === 'cancelled') {
    return null;
  }

  const enrichedSubscriptionData: StripeSubscription & SubscriptionFieldsFromStripe = {
    ...activeSpaceSubscription,
    ...stripeData
  };

  return enrichedSubscriptionData;
}
