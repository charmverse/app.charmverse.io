import { prisma } from '@charmverse/core';
import type { SubscriptionTier } from '@charmverse/core/prisma';

import { NotFoundError } from 'lib/middleware';

import { stripeClient } from './stripe';
import type { SubscriptionUsage, SubscriptionPeriod } from './utils';

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

  return subscription.metadata as SpaceSubscription;
}
