import { InvalidInputError } from '@charmverse/core/errors';
import { stripeMock } from '@packages/testing/stripeMock';
import { v4 } from 'uuid';

import { stripeClient } from '../stripe';
import { validateDiscountCode } from '../validateDiscountCode';

jest.doMock('../stripe', () => ({ ...stripeMock }));

describe('updateProSubscription', () => {
  it(`Should validate a coupon and return the discount details`, async () => {
    const couponId = v4();

    const couponData = {
      id: couponId,
      valid: true,
      percent_off: 10,
      amount_off: undefined
    };

    (stripeClient.promotionCodes.list as jest.Mock) = jest.fn().mockResolvedValue({ data: [] });
    (stripeClient.coupons.retrieve as jest.Mock) = jest.fn().mockResolvedValue(couponData);

    const couponDetails = await validateDiscountCode({
      spaceId: v4(),
      coupon: couponId
    });

    expect(!!couponDetails).toBeTruthy();
    expect(couponDetails?.id).toBe(couponId);
    expect(couponDetails?.code).toBe(couponId);
    expect(couponDetails?.discountType).toBe('percent');
    expect(couponDetails?.discount).toBe(10);
    expect(couponDetails?.type).toBe('coupon');
  });

  it(`Should validate a promo code and return the discount details`, async () => {
    const promoCodeId = v4();
    const promoCode = 'promo1';

    const couponData = {
      id: promoCodeId,
      code: promoCode,
      coupon: {
        valid: true,
        amount_off: 10,
        percent_off: undefined
      }
    };

    (stripeClient.promotionCodes.list as jest.Mock) = jest.fn().mockResolvedValue({ data: [couponData] });

    const couponDetails = await validateDiscountCode({
      spaceId: v4(),
      coupon: promoCode
    });

    expect(!!couponDetails).not.toBeNull();
    expect(couponDetails?.id).toBe(promoCodeId);
    expect(couponDetails?.code).toBe(promoCode);
    expect(couponDetails?.discountType).toBe('fixed');
    expect(couponDetails?.discount).toBe(10);
    expect(couponDetails?.type).toBe('promotion_code');
  });

  it(`Should fail if the coupon is not valid`, async () => {
    const spaceId = v4();
    (stripeClient.promotionCodes.list as jest.Mock) = jest.fn().mockResolvedValue({ data: [] });
    (stripeClient.coupons.retrieve as jest.Mock) = jest.fn().mockResolvedValue({ id: v4(), valid: false });

    await expect(validateDiscountCode({ spaceId, coupon: v4() })).rejects.toBeInstanceOf(InvalidInputError);
  });

  it(`Should return null if no coupon was found`, async () => {
    const spaceId = v4();
    const validatedCoupon = await validateDiscountCode({ spaceId, coupon: '' });
    expect(validatedCoupon).toBeNull();
  });
});
