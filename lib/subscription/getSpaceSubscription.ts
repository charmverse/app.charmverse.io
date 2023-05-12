import { prisma } from '@charmverse/core';
import type { SubscriptionTier } from '@charmverse/core/prisma';

import type { SubscriptionUsage, SubscriptionPeriod } from './constants';
import { stripeClient } from './stripe';

export type SpaceSubscription = {
  usage: SubscriptionUsage;
  tier: SubscriptionTier;
  period: SubscriptionPeriod;
};

export async function getSpaceSubscription({ spaceId }: { spaceId: string }) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionId: true
    }
  });

  if (!space.subscriptionId) {
    return null;
  }

  const subscription = await stripeClient.subscriptions.retrieve(space.subscriptionId);

  return subscription.metadata as unknown as SpaceSubscription;
}
