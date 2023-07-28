import type { CouponDetails } from './getCouponDetails';

export const generatePriceDetails = (discount: CouponDetails | null | undefined, standardPrice: number) => {
  if (discount?.discountType === 'percent') {
    return {
      discount: (standardPrice * discount.discount) / 100,
      subTotal: standardPrice,
      total: standardPrice - (standardPrice * discount.discount) / 100
    };
  }
  if (discount?.discountType === 'fixed') {
    return {
      discount: discount.discount >= standardPrice ? standardPrice : discount.discount,
      subTotal: standardPrice,
      total: discount.discount >= standardPrice ? 0 : standardPrice - discount.discount
    };
  }
  return {
    discount: 0,
    subTotal: standardPrice,
    total: standardPrice
  };
};
