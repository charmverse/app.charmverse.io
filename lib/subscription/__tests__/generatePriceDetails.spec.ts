import { v4 } from 'uuid';

import { generatePriceDetails } from '../generatePriceDetails';

describe('generatePriceDetails', () => {
  const code = 'test';
  const id = v4();
  const type = 'coupon' as const;
  const price = 100;

  it('should return the correct price details when there is a percent discount', () => {
    const discountPercent = 15;
    const discount = {
      id,
      code,
      type,
      discountType: 'percent' as const,
      discount: discountPercent
    };

    const expected = {
      discount: discountPercent,
      subTotal: 100,
      total: 85
    };
    expect(generatePriceDetails(discount, price)).toEqual(expected);
  });

  it('should return the correct price details when there is a fixed discount', () => {
    const discountAmount = 45;
    const discount = {
      id,
      code,
      type,
      discountType: 'fixed' as const,
      discount: discountAmount
    };

    const expected = {
      discount: discountAmount,
      subTotal: 100,
      total: 55
    };
    expect(generatePriceDetails(discount, price)).toEqual(expected);
  });
});
