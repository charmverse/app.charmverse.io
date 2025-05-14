import { log } from '@charmverse/core/log';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';

export const SubscriptionTierAmountRecord: Record<SpaceSubscriptionTier, bigint> = {
  free: parseUnits('0', 18),
  bronze: parseUnits('1000', 18),
  silver: parseUnits('2500', 18),
  gold: parseUnits('10000', 18),
  grant: parseUnits('0', 18),
  readonly: parseUnits('0', 18)
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

  const subscriptionTier = space.subscriptionTier;
  const spaceTokenBalance = await getSpaceTokenBalance({ spaceId });

  const subscriptionTierAmount = SubscriptionTierAmountRecord[subscriptionTier];

  if (parseUnits(spaceTokenBalance.toString(), 18) < subscriptionTierAmount) {
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
