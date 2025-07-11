import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

import type { UpgradableTier } from './constants';
import { tierConfig } from './constants';

export function calculateSubscriptionCost({
  currentTier,
  newTier,
  overridenTierPrice,
  paymentMonths
}: {
  currentTier?: SpaceSubscriptionTier | null;
  newTier: UpgradableTier;
  overridenTierPrice?: number | null;
  paymentMonths: number;
}) {
  const currentTierPrice = currentTier ? tierConfig[currentTier].tokenPrice : 0;
  const newTierPrice = overridenTierPrice || tierConfig[newTier].tokenPrice;

  const now = DateTime.now();
  const monthEnd = now.endOf('month');
  const daysRemaining = Math.ceil(monthEnd.diff(now, 'days').days);
  const daysInThisMonth = Math.ceil(monthEnd.diff(now.startOf('month'), 'days').days);

  // calculate price for the number of months
  const priceForMonths = paymentMonths * newTierPrice;
  // Value of unused days at the current tier rate
  const daysAlreadyPaid = daysInThisMonth - daysRemaining;
  const amountToProrate = Math.ceil(daysAlreadyPaid * (currentTierPrice / daysInThisMonth));
  const priceForMonthsMinusProrated = priceForMonths - amountToProrate;
  // just in case the 'upgrade' is somehow more expensive than the prorated amount (happens in dev sometimes)
  const devTokensToSend = Math.max(priceForMonthsMinusProrated, priceForMonthsMinusProrated);
  const immediatePaymentRaw = newTierPrice - amountToProrate; // we will subtract this from the space token balance
  const immediatePayment = Math.max(immediatePaymentRaw, 0);
  return {
    newTierPrice,
    actualTierPrice: tierConfig[newTier].tokenPrice,
    amountToProrate,
    immediatePayment,
    priceForMonths,
    devTokensToSend
  };
}
