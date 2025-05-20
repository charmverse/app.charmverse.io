import { prisma } from '@charmverse/core/prisma-client';

import type { DowngradeableTier } from './constants';
import { downgradeableTiers } from './constants';

export type DowngradeSubscriptionRequest = {
  tier: DowngradeableTier;
};

export async function downgradeSubscription(
  payload: DowngradeSubscriptionRequest & {
    spaceId: string;
  }
) {
  const { spaceId, tier } = payload;

  if (!downgradeableTiers.includes(tier)) {
    throw new Error('Invalid tier to downgrade to');
  }
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true,
      subscriptionCancelledAt: true
    }
  });

  if (space.subscriptionTier === tier) {
    throw new Error('Cannot downgrade to the same tier');
  }

  if (space.subscriptionCancelledAt) {
    throw new Error('Cannot downgrade a cancelled subscription');
  }

  const currentTierIndex = downgradeableTiers.indexOf(space.subscriptionTier as DowngradeableTier);
  const newTierIndex = downgradeableTiers.indexOf(tier);

  // a space in readonly may "downgrade" to a higher tier
  if (newTierIndex > currentTierIndex) {
    throw new Error('Cannot downgrade to a higher tier');
  }

  await prisma.spaceSubscriptionTierChangeEvent.create({
    data: {
      spaceId,
      previousTier: space.subscriptionTier ?? 'readonly',
      newTier: tier
    }
  });
}
