import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { tierConfig } from '@packages/subscriptions/constants';
import { DateTime } from 'luxon';

export type SpaceSubscriptionStatus = {
  tier: SpaceSubscriptionTier;
  pendingTier?: SpaceSubscriptionTier; // if the user is upgrading or downgrading next month
  tokenBalance: { value: string; formatted: number };
  subscriptionCancelledAt?: string;
  expiresAt?: string;
  isReadonlyNextMonth: boolean;
};

export async function getSubscriptionStatus(spaceId: string) {
  const [space, tokenBalance, subscriptionEvents] = await Promise.all([
    prisma.space.findUniqueOrThrow({
      where: {
        id: spaceId
      },
      select: {
        subscriptionTier: true,
        subscriptionCancelledAt: true
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
  const nextTier = subscriptionEvents[0].newTier;
  const expiresAt = getExpiresAt(currentTier, tokenBalance.formatted);
  // determine if there is not enough balance to cover the next tier, the user will be downgraded to readonly
  const finalExpiresAt = getExpiresAt(nextTier, tokenBalance.formatted);
  const nextMonth = DateTime.utc().endOf('month').plus({ months: 1 }).startOf('month');
  const isReadonlyNextMonth = !space.subscriptionCancelledAt && finalExpiresAt && finalExpiresAt < nextMonth;

  return {
    tokenBalance: {
      value: tokenBalance.value.toString(),
      formatted: tokenBalance.formatted
    },
    tier: currentTier,
    pendingTier: nextTier !== currentTier ? nextTier : undefined,
    subscriptionCancelledAt: space.subscriptionCancelledAt?.toISOString() || undefined,
    expiresAt,
    isReadonlyNextMonth
  };
}

// undefined balance means it is loading still
function getExpiresAt(tier: SpaceSubscriptionTier | null, spaceTokenBalance: number) {
  if (!tier) {
    return null;
  }
  const tierPrice = tierConfig[tier].tokenPrice;
  if (tierPrice > 0) {
    const monthsLeft = Math.floor(spaceTokenBalance / tierPrice);
    return DateTime.utc().endOf('month').plus({ months: monthsLeft }).endOf('month');
  }
  return null;
}
