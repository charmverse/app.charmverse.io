import { log } from '@charmverse/core/log';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { parseUnits } from 'viem';

import { getSpaceTokenBalance } from '../spaces/getSpaceTokenBalance';

export const SubscriptionTierAmountRecord: Record<SpaceSubscriptionTier, bigint> = {
  free: parseUnits('0', 18),
  bronze: parseUnits('1000', 18),
  silver: parseUnits('2000', 18),
  gold: parseUnits('3000', 18),
  grant: parseUnits('0', 18),
  readonly: parseUnits('0', 18)
};

export async function chargeSpaceSubscription({ spaceId }: { spaceId: string }) {
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

  const subscriptionTier = space.subscriptionTier;
  const spaceTokenBalance = await getSpaceTokenBalance({ spaceId });

  const subscriptionTierAmount = SubscriptionTierAmountRecord[subscriptionTier];

  if (spaceTokenBalance < subscriptionTierAmount) {
    await prisma.space.update({
      where: { id: spaceId },
      data: {
        subscriptionTier: 'free'
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
        spaceId
      }
    });
  }
}
