import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { tierConfig } from '@packages/subscriptions/constants';
import { DateTime } from 'luxon';

export const UpgradableTiers = ['bronze', 'silver', 'gold'] as const;

export type UpgradableTier = (typeof UpgradableTiers)[number];

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
  const immediatePaymentRaw = newTierPrice - amountToProrate; // we will subtract this from the space token balance
  const immediatePayment = immediatePaymentRaw > 0 ? immediatePaymentRaw : 0;
  return {
    newTierPrice,
    amountToProrate,
    immediatePayment,
    priceForMonths,
    devTokensToSend: priceForMonthsMinusProrated
  };
}
