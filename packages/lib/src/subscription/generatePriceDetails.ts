import type { CouponDetails } from './getCouponDetails';

export const generatePriceDetails = (
  discount: CouponDetails | null | undefined,
  standardPrice: number // price already in dollars (monthly or yearly)
) => {
  if (discount?.discountType === 'percent') {
    // Apply percentage discount directly to the standard price
    const discountAmount = (standardPrice * discount.discount) / 100;
    return {
      discount: discountAmount,
      subTotal: standardPrice,
      total: standardPrice - discountAmount
    };
  }

  if (discount?.discountType === 'fixed') {
    // Convert fixed discount from cents to dollars
    const normalisedDiscount = discount.discount / 100;

    // Ensure the fixed discount doesn't exceed the standard price
    return {
      discount: normalisedDiscount >= standardPrice ? standardPrice : normalisedDiscount,
      subTotal: standardPrice,
      total: normalisedDiscount >= standardPrice ? 0 : standardPrice - normalisedDiscount
    };
  }

  // No discount applied
  return {
    discount: 0,
    subTotal: standardPrice,
    total: standardPrice
  };
};
