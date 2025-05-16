import { prisma } from '@charmverse/core/prisma-client';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';

import type { UpgradableTier } from './calculateSubscriptionCost';
import { calculateSubscriptionCost, UpgradableTiers } from './calculateSubscriptionCost';
import { SubscriptionTierAmountRecord } from './chargeSpaceSubscription';

export type UpgradeSubscriptionTierRequest = {
  tier: UpgradableTier;
  paymentMonths: number;
};

export async function upgradeSubscriptionTier(
  payload: UpgradeSubscriptionTierRequest & {
    spaceId: string;
  }
) {
  const { spaceId, tier } = payload;
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true
    }
  });

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
