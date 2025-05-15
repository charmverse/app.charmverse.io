import { log } from '@charmverse/core/log';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';

import { UpgradableTiers, type UpgradableTier } from './calculateSubscriptionCost';

export const SubscriptionTierAmountRecord: Record<SpaceSubscriptionTier, number> = {
  free: 0,
  bronze: 10,
  silver: 25,
  gold: 100,
  grant: 0,
  readonly: 0,
  cancelled: 0
};

export async function chargeSpaceSubscription({ spaceId }: { spaceId: string }) {
  const startOfMonth = DateTime.now().startOf('month');
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true
    }
  });

  if (!space.subscriptionTier) {
    throw new Error('Space is not a subscription space');
  }

  if (space.subscriptionTier === 'cancelled') {
    throw new Error('Space subscription is cancelled');
  }

  if (!UpgradableTiers.includes(space.subscriptionTier as UpgradableTier)) {
    throw new Error('Space subscription is not chargeable');
  }

  const subscriptionTier = space.subscriptionTier;
  const spaceTokenBalance = await getSpaceTokenBalance({ spaceId });

  const subscriptionTierAmount = SubscriptionTierAmountRecord[subscriptionTier];

  const spaceTokenBalanceInWei = parseUnits(spaceTokenBalance.toString(), 18);
  const subscriptionTierAmountInWei = parseUnits(subscriptionTierAmount.toString(), 18);

  if (spaceTokenBalanceInWei < subscriptionTierAmountInWei) {
    await prisma.space.update({
      where: { id: spaceId },
      data: {
        subscriptionTier: 'readonly'
      }
    });
    log.warn(`Insufficient space token balance, space downgraded to free tier`, {
      spaceId,
      spaceTokenBalance,
      subscriptionTier
    });
  } else {
    await prisma.spaceSubscriptionPayment.create({
      data: {
        paidTokenAmount: subscriptionTierAmount.toString(),
        spaceId,
        subscriptionTier,
        subscriptionPeriodStart: startOfMonth.toJSDate(),
        subscriptionPrice: subscriptionTierAmount.toString()
      }
    });
  }
}
