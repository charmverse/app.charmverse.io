import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { StripeSubscription } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type Stripe from 'stripe';

import type { SubscriptionPeriod, SubscriptionStatusType } from './constants';
import { stripeClient } from './stripe';

type PaymentMethodType = 'card' | 'ach';

type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  digits: string;
};

/**
 * @blockQuota - The number of blocks a space can have in total, expressed as a multiple of 1k.
 * @cancelAtPeriodEnd - Whether the subscription has been cancelled and will terminate at the end of the current period.
 * @expiresOn - The date when the free trial will expire OR the cancellation will be final.
 * @renewalDate - The date when the next payment will occur
 * @priceInCents - The price of the subscription in cents - Stripe models the amount like this
 */
type SubscriptionFieldsFromStripe = {
  period: SubscriptionPeriod;
  status: SubscriptionStatusType;
  blockQuota: number;
  priceInCents: number;
  billingEmail?: string;
  expiresOn?: Date;
  renewalDate?: Date;
  paymentMethod: PaymentMethod;
};

export type SpaceSubscriptionWithStripeData = StripeSubscription & SubscriptionFieldsFromStripe;

function getStripeStatusAndDates(status: Stripe.Subscription.Status): SubscriptionStatusType {
  switch (status) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'cancelled';
    case 'incomplete_expired':
      return 'cancelled';
    case 'past_due':
      return 'active';
    case 'trialing':
      return 'free_trial';
    case 'unpaid':
      return 'past_due';
    case 'incomplete':
    default:
      return 'pending';
  }
}

export async function getSpaceSubscription({
  spaceId
}: {
  spaceId: string;
}): Promise<SpaceSubscriptionWithStripeData | null> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
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

  if (!activeSpaceSubscription) {
    throw new DataNotFoundError(`No active subscription found for space ${spaceId}`);
  }

  const subscriptionInStripe = await stripeClient.subscriptions.retrieve(activeSpaceSubscription.subscriptionId, {
    expand: ['data.customer']
  });

  // We expect to always have a quantity, but we'll log an error if we don't
  const blockQuota = subscriptionInStripe.items.data[0].quantity as number;

  if (!blockQuota) {
    log.error(`No block quota found for subscription ${activeSpaceSubscription.subscriptionId}`, {
      spaceId,
      subscriptionId: activeSpaceSubscription.subscriptionId,
      customerId: (subscriptionInStripe.customer as Stripe.Customer).id
    });
  }

  const enrichedSubscriptionData: SubscriptionFieldsFromStripe = {
    blockQuota,
    period: subscriptionInStripe.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'annual',
    priceInCents: subscriptionInStripe.items.data[0].price.unit_amount ?? 0,
    status: subscriptionInStripe.status as SubscriptionStatusType
  } as any;

  return { ...activeSpaceSubscription, blockQuota } as SpaceSubscriptionWithStripeData;
}
