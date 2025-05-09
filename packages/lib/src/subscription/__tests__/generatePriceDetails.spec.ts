import { v4 } from 'uuid';

import { generatePriceDetails } from '../generatePriceDetails';
import type { CouponDetails } from '../getCouponDetails';

describe('generatePriceDetails', () => {
  const code = 'test';
  const id = v4();
  const type = 'coupon' as const;
  // Simulating paying $100 - UI currently provides value as $, not cts
  const price = 100;

  it('should return the correct price details when there is a percent discount', () => {
    const discountPercent = 20;
    const discount: CouponDetails = {
      id,
      code,
      type,
      discountType: 'percent' as const,
      discount: discountPercent
    };

    const expected = {
      discount: discountPercent,
      subTotal: 100,
      total: 80
    };
    expect(generatePriceDetails(discount, price)).toEqual(expected);
  });

  it('should return the correct price details when there is a fixed discount', () => {
    // Stripe API returns fixed discount in cents
    const discountAmount = 5000;
    const discount = {
      id,
      code,
      type,
      discountType: 'fixed' as const,
      discount: discountAmount
    };

    const expected = {
      discount: 50,
      subTotal: 100,
      total: 50
    };
    expect(generatePriceDetails(discount, price)).toEqual(expected);
  });
});
