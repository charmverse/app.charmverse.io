import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { tierConfig } from '@packages/subscriptions/constants';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';

import type { UpgradableTier } from './constants';
import { upgradableTiers } from './constants';
import { updateSubscription } from './updateSubscription';

export async function chargeSpaceSubscription({ spaceId }: { spaceId: string }) {
  const startOfMonth = DateTime.utc().startOf('month');
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionMonthlyPrice: true,
      subscriptionTier: true,
      subscriptionCancelledAt: true,
      subscriptionTierChangeEvents: {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  const subscriptionTier = space.subscriptionTierChangeEvents[0]?.newTier ?? space.subscriptionTier;

  if (!subscriptionTier) {
    throw new Error('Space is not a subscription space');
  }

  if (!upgradableTiers.includes(space.subscriptionTier as UpgradableTier)) {
    throw new Error('Space subscription is not chargeable');
  }

  const { value: spaceTokenBalance } = await getSpaceTokenBalance({ spaceId });

  const subscriptionTierAmount = tierConfig[subscriptionTier].tokenPrice;
  const amountToCharge = space.subscriptionMonthlyPrice ?? subscriptionTierAmount;

  const amountToChargeInWei = parseUnits(amountToCharge.toString(), 18);

  if (spaceTokenBalance < amountToChargeInWei) {
    await updateSubscription({
      spaceId,
      newTier: 'readonly'
    });

    log.warn(`Insufficient space token balance, space downgraded to readonly tier`, {
      spaceId,
      spaceTokenBalance,
      subscriptionTier
    });
  } else {
    await prisma.$transaction(async () => {
      await prisma.spaceSubscriptionPayment.create({
        data: {
          paidTokenAmount: amountToChargeInWei.toString(),
          spaceId,
          subscriptionTier,
          subscriptionPeriodStart: startOfMonth.toJSDate(),
          subscriptionPrice: subscriptionTierAmount.toString()
        }
      });

      // the sub is being downgraded because upgrades happen immediately
      if (space.subscriptionTier !== subscriptionTier) {
        await updateSubscription({
          spaceId,
          newTier: space.subscriptionCancelledAt ? 'readonly' : subscriptionTier
        });
      }
    });
  }
}
