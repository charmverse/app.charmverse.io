/* eslint-disable camelcase */

import { log } from '@charmverse/core/log';
import { coerceToMilliseconds } from '@packages/lib/utils/dates';
import type Stripe from 'stripe';

import { DeprecatedFreeTrial } from './constants';
import type { SubscriptionPeriod, SubscriptionStatusType } from './constants';
import type { CouponDetails } from './getCouponDetails';

function mapStripeStatus(subscription: Stripe.Subscription): SubscriptionStatusType | typeof DeprecatedFreeTrial {
  const { status, trial_end } = subscription;

  if (subscription.cancel_at_period_end) {
    return 'cancel_at_end';
  } else if (
    trial_end &&
    // Stripe value is in seconds
    (trial_end && 1000) > Date.now()
  ) {
    return DeprecatedFreeTrial;
  }

  switch (status) {
    case 'active':
      return 'active';
    case 'incomplete_expired':
    case 'canceled':
      return 'cancelled';
    case 'past_due':
      return 'past_due';
    // A paused subscription is like an ended trial subscription.
    // It has 0 days left and the user is obliged to take an action to downgrade or pay for another one.
    case 'paused':
    case 'trialing':
      return DeprecatedFreeTrial;
    case 'unpaid':
      return 'unpaid';
    case 'incomplete':
    default:
      log.error(`Invalid subscription status ${subscription.status}`);
      return 'pending';
  }
}

export type PaymentMethod = {
  id: string;
  type?: Stripe.PaymentMethod.Type;
  digits?: string | null;
  brand?: string | null;
};

/**
 * @blockQuota - The number of blocks a space can have in total, expressed as a multiple of 1k.
 * @cancelAtPeriodEnd - Whether the subscription has been cancelled and will terminate at the end of the current period.
 * @expiresOn - The date when the free trial will expire OR the cancellation will be final.
 * @renewalDate - The date when the next payment will occur
 * @priceInCents - The price of the subscription in cents - Stripe models the amount like this
 */
export type SubscriptionFieldsFromStripe = {
  period: SubscriptionPeriod;
  status: SubscriptionStatusType | typeof DeprecatedFreeTrial;
  blockQuota: number;
  priceInCents: number;
  billingEmail?: string | null;
  expiresOn?: Date | null;
  renewalDate?: Date | null;
  paymentMethod?: PaymentMethod | null;
  coupon?: string;
  discount?: CouponDetails;
};
export function mapStripeFields({
  subscription,
  spaceId
}: {
  subscription: Stripe.Subscription & {
    customer: Stripe.Customer;
    default_payment_method: Stripe.PaymentMethod | null;
  };
  spaceId: string;
}): SubscriptionFieldsFromStripe {
  // We expect to always have a quantity, but we'll log an error if we don't
  const blockQuota = subscription.items.data[0].quantity as number;

  if (!blockQuota) {
    log.error(`No block quota found for subscription ${subscription.id}`, {
      spaceId,
      subscriptionId: subscription.id,
      customerId: subscription.customer.id
    });
  }

  const paymentDetails = subscription.default_payment_method;
  const paymentType = paymentDetails?.type;
  const paymentCard = paymentDetails?.card?.brand ?? paymentDetails?.us_bank_account?.bank_name;
  const last4 = paymentDetails?.card?.last4 ?? paymentDetails?.us_bank_account?.last4;
  const paymentMethod: PaymentMethod | null = paymentDetails
    ? {
        id: paymentDetails.id,
        brand: paymentCard,
        digits: last4,
        type: paymentType
      }
    : null;

  const status = mapStripeStatus(subscription);
  const expiryDate = status === 'cancel_at_end' ? subscription.current_period_end : null;

  const discount = subscription.discount;
  const fields: SubscriptionFieldsFromStripe = {
    period: subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'annual',
    priceInCents: subscription.items.data[0].price.unit_amount ?? 0,
    blockQuota,
    status,
    paymentMethod,
    billingEmail: subscription.customer.email,
    expiresOn: typeof expiryDate === 'number' ? new Date(coerceToMilliseconds(expiryDate)) : null,
    discount: discount
      ? {
          id: discount.id,
          code: typeof discount.promotion_code === 'string' ? discount.promotion_code : discount.coupon?.id || '',
          type: discount.promotion_code ? 'promotion_code' : 'coupon',
          discountType: discount.coupon?.percent_off ? 'percent' : 'fixed',
          discount: discount.coupon?.percent_off ?? subscription.discount?.coupon?.amount_off ?? 0
        }
      : undefined,
    renewalDate: subscription.current_period_end
      ? new Date(coerceToMilliseconds(subscription.current_period_end))
      : undefined
  };

  return fields;
}
