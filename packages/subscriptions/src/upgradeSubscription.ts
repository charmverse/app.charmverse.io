import { prisma } from '@charmverse/core/prisma-client';
import type { UpgradableTier } from '@packages/lib/subscription/calculateSubscriptionCost';
import { calculateSubscriptionCost, UpgradableTiers } from '@packages/lib/subscription/calculateSubscriptionCost';
import { SubscriptionTierAmountRecord } from '@packages/lib/subscription/chargeSpaceSubscription';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';

export type UpgradeSubscriptionRequest = {
  tier: UpgradableTier;
  paymentMonths: number;
};

export async function upgradeSubscription(
  payload: UpgradeSubscriptionRequest & {
    spaceId: string;
  }
) {
  const { spaceId, tier } = payload;
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true,
      subscriptionCancelledAt: true
    }
  });

  if (space.subscriptionCancelledAt) {
    throw new Error('You cannot upgrade subscription after it has been cancelled');
  }

  if (!UpgradableTiers.includes(tier)) {
    throw new Error('Invalid tier');
  }

  const spaceTokenBalance = await getSpaceTokenBalance({ spaceId });

  const { proratedMonthCost, totalCost } = calculateSubscriptionCost({
    currentTier: space.subscriptionTier,
    selectedTier: tier,
    paymentMonths: payload.paymentMonths,
    spaceTokenBalance
  });

  const subscriptionPrice = SubscriptionTierAmountRecord[tier];
  const subscriptionPriceInWei = parseUnits(subscriptionPrice.toString(), 18);
  const proratedMonthCostInWei = parseUnits(proratedMonthCost.toString(), 18);
  const totalCostInWei = parseUnits(totalCost.toString(), 18);
  const spaceTokenBalanceInWei = parseUnits(spaceTokenBalance.toString(), 18);

  if (spaceTokenBalanceInWei < totalCostInWei) {
    throw new Error('Insufficient space token balance');
  }

  await prisma.$transaction([
    prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        subscriptionTier: tier
      }
    }),
    prisma.spaceSubscriptionPayment.create({
      data: {
        spaceId,
        subscriptionTier: tier,
        subscriptionPeriodStart: DateTime.now().toJSDate(),
        subscriptionPrice: subscriptionPriceInWei.toString(),
        paidTokenAmount: proratedMonthCostInWei.toString()
      }
    }),
    prisma.spaceSubscriptionTierChangeEvent.create({
      data: {
        spaceId,
        previousTier: space.subscriptionTier ?? 'readonly',
        newTier: tier
      }
    })
  ]);
}
