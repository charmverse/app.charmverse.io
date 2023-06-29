import type Stripe from 'stripe';

import { stripeClient } from './stripe';

export async function getCouponDetails(
  couponCode: string
): Promise<{ id: string; type: 'coupon' | 'promotion_code' } | undefined> {
  const listPromocode = await stripeClient.promotionCodes.list({ code: couponCode, active: true });
  const promocode: Stripe.PromotionCode | undefined = listPromocode.data[0];

  if (!promocode) {
    try {
      const couponData = await stripeClient.coupons.retrieve(couponCode);
      return { id: couponData.id, type: 'coupon' };
    } catch (_) {
      return undefined;
    }
  } else {
    if (!promocode.coupon.valid) {
      return undefined;
    }
    return { id: promocode.id, type: 'promotion_code' };
  }
}
