import { prisma } from '@charmverse/core/prisma-client';

export const DowngradeableTiers = ['free', 'bronze', 'silver', 'gold'] as const;
export type DowngradeableTier = (typeof DowngradeableTiers)[number];

export type DowngradeSubscriptionTierRequest = {
  tier: DowngradeableTier;
};

export async function downgradeSubscriptionTier(
  payload: DowngradeSubscriptionTierRequest & {
    spaceId: string;
  }
) {
  const { spaceId, tier } = payload;

  if (!DowngradeableTiers.includes(tier)) {
    throw new Error('Invalid tier to downgrade to');
  }

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true
    }
  });

  if (space.subscriptionTier === tier) {
    throw new Error('Cannot downgrade to the same tier');
  }

  if (space.subscriptionTier === 'cancelled') {
    throw new Error('Cannot downgrade a cancelled subscription');
  }

  const currentTierIndex = DowngradeableTiers.indexOf(space.subscriptionTier as DowngradeableTier);
  const newTierIndex = DowngradeableTiers.indexOf(tier);

  if (newTierIndex > currentTierIndex) {
    throw new Error('Cannot downgrade to a higher tier');
  }

  await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      subscriptionTier: tier
    }
  });
}
