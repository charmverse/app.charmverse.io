import fs from 'node:fs/promises';
import path from 'node:path';

import type { StripeSubscription } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type Stripe from 'stripe';

import { getStripeCustomerBySpaceId } from './getStripeCustomerBySpaceId';
import type { SubscriptionFieldsFromStripe } from './mapStripeFields';
import { mapStripeFields } from './mapStripeFields';
import { stripeClient } from './stripe';

export type SpaceSubscriptionRequest = {
  spaceId: string;
  returnUrl?: string;
};

export type SpaceSubscriptionWithStripeData = StripeSubscription & SubscriptionFieldsFromStripe;

export async function getActiveSpaceSubscription({
  spaceId,
  returnUrl
}: SpaceSubscriptionRequest): Promise<SpaceSubscriptionWithStripeData | null> {
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

  await fs.writeFile(
    `${path.resolve('jsonoutputs')}/${Date.now()}.json`,
    JSON.stringify(subscriptionInStripe, null, 2)
  );

  const stripeData = mapStripeFields({
    spaceId,
    subscription: subscriptionInStripe as Stripe.Subscription & { customer: Stripe.Customer }
  });

  if (stripeData.paymentMethod) {
    const updateUrl = await stripeClient.paymentMethods.retrieve(stripeData.paymentMethod.id);
    await fs.writeFile(`${path.resolve('jsonoutputs')}/payment-${Date.now()}.json`, JSON.stringify(updateUrl, null, 2));
    const customer = await getStripeCustomerBySpaceId({ spaceId });
    await fs.writeFile(`${path.resolve('jsonoutputs')}/customer-${Date.now()}.json`, JSON.stringify(customer, null, 2));

    if (customer) {
      const portal = await stripeClient.billingPortal.sessions.create({ customer: customer.id, return_url: returnUrl });
      stripeData.paymentMethod.updateUrl = portal.url;
    }
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
