import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { tierConfig } from '@packages/subscriptions/constants';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';

import type { UpgradableTier } from './constants';
import { upgradableTiers } from './constants';
import { updateSubscription } from './updateSubscription';

export async function chargeSpaceSubscription({ spaceId }: { spaceId: string }) {
  const startOfMonth = DateTime.now().startOf('month');
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true,
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

  const subscriptionTierAmountInWei = parseUnits(subscriptionTierAmount.toString(), 18);

  if (spaceTokenBalance < subscriptionTierAmountInWei) {
    await updateSubscription({ spaceId, newTier: 'readonly' });

    log.warn(`Insufficient space token balance, space downgraded to readonly tier`, {
      spaceId,
      spaceTokenBalance,
      subscriptionTier
    });
  } else {
    await prisma.$transaction(async () => {
      await prisma.spaceSubscriptionPayment.create({
        data: {
          paidTokenAmount: subscriptionTierAmount.toString(),
          spaceId,
          subscriptionTier,
          subscriptionPeriodStart: startOfMonth.toJSDate(),
          subscriptionPrice: subscriptionTierAmount.toString()
        }
      });

      await updateSubscription({ spaceId, newTier: subscriptionTier });
    });
  }
}
