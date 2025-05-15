import { prisma } from '@charmverse/core/prisma-client';
import type { CreateSpaceContributionRequest } from '@packages/spaces/createSpaceContribution';
import { createSpaceContribution } from '@packages/spaces/createSpaceContribution';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';

import type { UpgradableTier } from './calculateSubscriptionCost';
import { calculateSubscriptionCost, UpgradableTiers } from './calculateSubscriptionCost';
import { SubscriptionTierAmountRecord } from './chargeSpaceSubscription';

export type UpgradeSubscriptionTierRequest = CreateSpaceContributionRequest & {
  tier: UpgradableTier;
  paymentMonths: number;
};

export async function upgradeSubscriptionTier(
  payload: UpgradeSubscriptionTierRequest & {
    spaceId: string;
    userId: string;
  }
) {
  const { spaceId, tier, userId } = payload;
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

  // Create a space contribution to track the payment ie total cost (which deducts the space token balance)
  await createSpaceContribution({
    ...payload,
    userId,
    spaceId,
    paidTokenAmount: totalCostInWei.toString()
  });

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
    })
  ]);
}
