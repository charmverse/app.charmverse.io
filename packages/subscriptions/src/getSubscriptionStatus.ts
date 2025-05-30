import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { DateTime } from 'luxon';

import { tierConfig } from './constants';
import { getExpiresAt } from './getExpiresAt';

export type SpaceSubscriptionStatus = {
  tier: SpaceSubscriptionTier;
  monthlyPrice: number;
  pendingTier?: SpaceSubscriptionTier; // if the user is upgrading or downgrading next month
  pendingTierExpiresAt?: string;
  tokenBalance: { value: string; formatted: number };
  subscriptionCancelledAt?: string;
  expiresAt?: string;
  isReadonlyNextMonth: boolean;
};

export async function getSubscriptionStatus(spaceId: string): Promise<SpaceSubscriptionStatus> {
  const [space, tokenBalance, subscriptionEvents] = await Promise.all([
    prisma.space.findUniqueOrThrow({
      where: {
        id: spaceId
      },
      select: {
        id: true,
        domain: true,
        subscriptionTier: true,
        subscriptionCancelledAt: true,
        subscriptionMonthlyPrice: true
      }
    }),
    getSpaceTokenBalance({ spaceId }),
    prisma.spaceSubscriptionTierChangeEvent.findMany({
      where: {
        spaceId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    })
  ]);

  const currentTier = space.subscriptionTier || 'gold';
  const nextTier = subscriptionEvents[0]?.newTier;
  const expiresAt = getExpiresAt({
    tier: currentTier,
    spaceTokenBalance: tokenBalance.formatted,
    tierPrice: space.subscriptionMonthlyPrice
  });
  // determine if there is not enough balance to cover the next tier, the user will be downgraded to readonly
  const finalExpiresAt = getExpiresAt({
    tier: nextTier,
    spaceTokenBalance: tokenBalance.formatted,
    tierPrice: space.subscriptionMonthlyPrice
  });
  const nextMonth = DateTime.utc().endOf('month').plus({ months: 1 }).startOf('month');
  const isReadonlyNextMonth = Boolean(!space.subscriptionCancelledAt && finalExpiresAt && finalExpiresAt < nextMonth);

  return {
    tokenBalance: {
      value: tokenBalance.value.toString(),
      formatted: tokenBalance.formatted
    },
    tier: currentTier,
    monthlyPrice: space.subscriptionMonthlyPrice || tierConfig[currentTier].tokenPrice,
    pendingTier: nextTier !== currentTier ? nextTier : undefined,
    pendingTierExpiresAt: finalExpiresAt?.toJSDate().toISOString() || undefined,
    subscriptionCancelledAt: space.subscriptionCancelledAt?.toISOString() || undefined,
    expiresAt: expiresAt?.toJSDate().toISOString() || undefined,
    isReadonlyNextMonth
  };
}
