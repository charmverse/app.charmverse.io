import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

import { SubscriptionTierAmountRecord } from './chargeSpaceSubscription';

export const UpgradableTiers = ['bronze', 'silver', 'gold'] as const;

export type UpgradableTier = (typeof UpgradableTiers)[number];

export function calculateSubscriptionCost({
  currentTier,
  selectedTier,
  paymentMonths,
  spaceTokenBalance
}: {
  currentTier?: SpaceSubscriptionTier | null;
  selectedTier: UpgradableTier | null;
  paymentMonths: number;
  spaceTokenBalance: number;
}) {
  const fullMonthPrice = selectedTier ? SubscriptionTierAmountRecord[selectedTier] : 0;
  const currentTierPrice = currentTier ? SubscriptionTierAmountRecord[currentTier] : 0;

  const now = DateTime.now();
  const monthEnd = now.endOf('month');
  const daysRemaining = Math.floor(monthEnd.diff(now, 'days').days) + 1;
  const totalDays = monthEnd.diff(now.startOf('month'), 'days').days + 1;

  let proratedMonthCost = 0;
  let remainingMonthsCost = 0;
  let totalCost = 0;
  let unusedCurrentTierValue = 0;
  let proratedNewTierUnusedValue = 0;
  let spaceBalanceUsed = 0;

  if (selectedTier) {
    // Value of unused days at the new tier rate
    proratedNewTierUnusedValue = Number((fullMonthPrice * (daysRemaining / totalDays)).toFixed(2));
    // Value of unused days at the current tier rate
    unusedCurrentTierValue = Number((currentTierPrice * (daysRemaining / totalDays)).toFixed(2));

    // Calculate the cost for remaining months
    remainingMonthsCost = (paymentMonths - 1) * fullMonthPrice;

    spaceBalanceUsed = Math.min(
      spaceTokenBalance,
      Number((fullMonthPrice - (proratedNewTierUnusedValue + unusedCurrentTierValue)).toFixed(2))
    );

    // Total cost is the prorated new tier cost plus remaining months, minus unused current tier value
    totalCost = Math.max(
      Number((proratedNewTierUnusedValue + remainingMonthsCost - unusedCurrentTierValue - spaceBalanceUsed).toFixed(2)),
      0
    );

    // Set proratedMonthCost to the actual prorated amount for the new tier
    proratedMonthCost = spaceBalanceUsed;
  }

  return {
    spaceBalanceUsed,
    proratedMonthCost,
    fullMonthPrice,
    totalCost,
    unusedCurrentTierValue,
    proratedNewTierUnusedValue
  };
}
