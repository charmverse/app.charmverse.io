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

  let unusedValue = 0;
  let proratedMonthCost = 0;
  let remainingMonthsCost = 0;
  let totalCost = 0;

  const now = DateTime.now();
  const monthEnd = now.endOf('month');
  const daysRemaining = Math.floor(monthEnd.diff(now, 'days').days) + 1;
  const totalDays = monthEnd.diff(now.startOf('month'), 'days').days + 1;

  if (selectedTier && (currentTier === 'free' || currentTier === 'readonly')) {
    unusedValue = Math.round(fullMonthPrice * (daysRemaining / totalDays));
    proratedMonthCost = fullMonthPrice - unusedValue;
    remainingMonthsCost = (paymentMonths - 1) * fullMonthPrice;
    totalCost = Math.max(Math.round(proratedMonthCost + remainingMonthsCost - spaceTokenBalance), 0);
  } else {
    // handle paid-to-paid upgrade if needed
    totalCost = Math.max(fullMonthPrice * paymentMonths - spaceTokenBalance, 0);
  }

  return {
    proratedMonthCost,
    fullMonthPrice,
    totalCost,
    unusedValue
  };
}
