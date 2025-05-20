import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

import type { UpgradableTier } from './constants';
import { tierConfig } from './constants';

export function calculateSubscriptionCost({
  currentTier,
  newTier,
  paymentMonths
}: {
  currentTier?: SpaceSubscriptionTier | null;
  newTier: UpgradableTier;
  paymentMonths: number;
}) {
  const currentTierPrice = currentTier ? tierConfig[currentTier].tokenPrice : 0;
  const newTierPrice = tierConfig[newTier].tokenPrice;

  const now = DateTime.now();
  const monthEnd = now.endOf('month');
  const daysRemaining = Math.floor(monthEnd.diff(now, 'days').days) + 1;
  const daysInThisMonth = monthEnd.diff(now.startOf('month'), 'days').days + 1;

  // calculate price for the number of months
  const priceForMonths = paymentMonths * newTierPrice;
  // Value of unused days at the current tier rate
  const amountToProrate = Math.ceil(daysRemaining * (currentTierPrice / daysInThisMonth));
  const priceForMonthsMinusProrated = priceForMonths - amountToProrate;
  // just in case the 'upgrade' is somehow more expensive than the prorated amount (happens in dev sometimes)
  const devTokensToSend = Math.max(priceForMonthsMinusProrated, priceForMonthsMinusProrated);
  const immediatePaymentRaw = newTierPrice - amountToProrate; // we will subtract this from the space token balance
  const immediatePayment = Math.max(immediatePaymentRaw, 0);
  return {
    newTierPrice,
    amountToProrate,
    immediatePayment,
    priceForMonths,
    devTokensToSend
  };
}
