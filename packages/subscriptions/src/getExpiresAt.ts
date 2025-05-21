import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { tierConfig } from '@packages/subscriptions/constants';
import { DateTime } from 'luxon';

// undefined balance means it is loading still
export function getExpiresAt(tier: SpaceSubscriptionTier | null, spaceTokenBalance: number) {
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
