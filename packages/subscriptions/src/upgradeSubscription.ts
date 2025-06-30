import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { calculateSubscriptionCost } from '@packages/subscriptions/calculateSubscriptionCost';
import type { UpgradableTier } from '@packages/subscriptions/constants';
import { upgradableTiers } from '@packages/subscriptions/constants';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';

export type UpgradeSubscriptionRequest = {
  tier: UpgradableTier;
  paymentMonths: number;
};

export async function upgradeSubscription(
  payload: UpgradeSubscriptionRequest & {
    spaceId: string;
    userId: string;
  }
) {
  const { spaceId, tier } = payload;
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true,
      subscriptionCancelledAt: true,
      subscriptionMonthlyPrice: true
    }
  });

  if (space.subscriptionCancelledAt) {
    throw new Error('You cannot upgrade subscription after it has been cancelled');
  }

  if (!upgradableTiers.includes(tier)) {
    throw new Error('Invalid tier');
  }

  const { value: spaceTokenBalanceInWei } = await getSpaceTokenBalance({ spaceId });

  const { newTierPrice, actualTierPrice, immediatePayment } = calculateSubscriptionCost({
    currentTier: space.subscriptionTier,
    newTier: tier,
    paymentMonths: payload.paymentMonths,
    overridenTierPrice: space.subscriptionMonthlyPrice
  });

  const immediatePaymentInWei = parseUnits(immediatePayment.toString(), 18);

  if (spaceTokenBalanceInWei < immediatePaymentInWei) {
    log.warn('Insufficient space token balance to upgrade subscription', {
      spaceId,
      userId: payload.userId,
      spaceTokenBalanceInWei,
      immediatePaymentInWei,
      newTierPrice
    });
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
        subscriptionPrice: actualTierPrice.toString(),
        paidTokenAmount: immediatePaymentInWei.toString()
      }
    }),
    prisma.spaceSubscriptionTierChangeEvent.create({
      data: {
        spaceId,
        previousTier: space.subscriptionTier ?? 'readonly',
        newTier: tier,
        userId: payload.userId
      }
    })
  ]);
}
