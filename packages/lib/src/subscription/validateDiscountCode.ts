import { InvalidInputError } from '@charmverse/core/errors';

import { getCouponDetails } from './getCouponDetails';

export async function validateDiscountCode({ spaceId, coupon }: { spaceId: string; coupon?: string }) {
  if (!coupon) {
    return null;
  }

  const couponDetails = await getCouponDetails(coupon);

  if (!couponDetails) {
    throw new InvalidInputError(`Invalid promotional code ${coupon} for space ${spaceId}`);
  }

  return couponDetails;
}
