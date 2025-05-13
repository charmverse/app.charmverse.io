import type Stripe from 'stripe';

import { stripeClient } from './stripe';

export type CouponDetails = {
  id: string;
  code: string;
  type: 'coupon' | 'promotion_code';
  discountType: 'percent' | 'fixed';
  discount: number;
};

export async function getCouponDetails(couponCode: string): Promise<CouponDetails | null> {
  const listPromocode = await stripeClient.promotionCodes.list({ code: couponCode, active: true });
  const promocode: Stripe.PromotionCode | undefined = listPromocode.data[0];

  if (!promocode) {
    try {
      const couponData = await stripeClient.coupons.retrieve(couponCode);

      if (!couponData.valid) {
        return null;
      }

      return {
        id: couponData.id,
        code: couponData.id,
        type: 'coupon',
        discountType: couponData.percent_off ? 'percent' : 'fixed',
        discount: couponData.amount_off || couponData.percent_off || 0
      };
    } catch (_) {
      return null;
    }
  } else {
    if (!promocode.coupon.valid) {
      return null;
    }

    return {
      id: promocode.id,
      code: promocode.code,
      type: 'promotion_code',
      discountType: promocode.coupon.percent_off ? 'percent' : 'fixed',
      discount: promocode.coupon.amount_off || promocode.coupon.percent_off || 0
    };
  }
}
