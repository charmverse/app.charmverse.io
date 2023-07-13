import { Divider, Stack, Typography } from '@mui/material';
import type { FormEvent, ReactNode } from 'react';

import Button from 'components/common/Button';
import type { SubscriptionPeriod } from 'lib/subscription/constants';
import type { CouponDetails } from 'lib/subscription/getCouponDetails';

export type OrderSummaryProps = {
  discount?: CouponDetails | null;
  period: SubscriptionPeriod;
  blockQuota: number;
  price: number;
  isLoading: boolean;
  disabledButton: boolean;
  children: ReactNode;
  handleCheckout: (e: FormEvent) => Promise<void>;
  handleCancelCheckout: () => void;
};

const generatePriceDetails = (discount: CouponDetails | null | undefined, standardPrice: number) => {
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

export function OrderSummary({
  discount,
  period,
  blockQuota,
  price,
  isLoading,
  disabledButton,
  children,
  handleCheckout,
  handleCancelCheckout
}: OrderSummaryProps) {
  const priceDetails = generatePriceDetails(discount, price * blockQuota * (period === 'annual' ? 12 : 1));

  return (
    <>
      <Typography variant='h6' mb={1}>
        Order Summary
      </Typography>
      <Stack display='flex' flexDirection='row' justifyContent='space-between'>
        <Stack>
          <Typography mb={1}>Community Edition</Typography>
          <Typography variant='body2'>Billed {period}</Typography>
        </Stack>
        <Stack>
          <Typography>${(price * blockQuota).toFixed(2)}/mo</Typography>
        </Stack>
      </Stack>
      <Divider sx={{ my: 1 }} />
      {children && (
        <>
          <Stack display='flex' flexDirection='column' gap={1}>
            {children}
          </Stack>
          <Divider sx={{ my: 2 }} />
        </>
      )}
      {discount && (
        <>
          <Stack display='flex' flexDirection='row' justifyContent='space-between'>
            <Stack>
              <Typography>Subtotal</Typography>
            </Stack>
            <Stack>
              <Typography>${priceDetails.subTotal.toFixed(2)}</Typography>
            </Stack>
          </Stack>
          <Stack display='flex' flexDirection='row' justifyContent='space-between'>
            <Stack>
              <Typography>Discount</Typography>
            </Stack>
            <Stack>
              <Typography>${priceDetails.discount.toFixed(2)}</Typography>
            </Stack>
          </Stack>
          <Divider sx={{ my: 1 }} />
        </>
      )}
      <Stack display='flex' flexDirection='row' justifyContent='space-between' mb={1}>
        <Stack>
          <Typography>Total</Typography>
        </Stack>
        <Stack>
          <Typography>${priceDetails.total.toFixed(2)}</Typography>
        </Stack>
      </Stack>
      <Stack gap={1} display='flex' flexDirection='column'>
        <Button onClick={handleCheckout} loading={isLoading} disabled={disabledButton || isLoading}>
          {isLoading ? 'Processing ... ' : 'Upgrade'}
        </Button>
        <Button disabled={isLoading} onClick={handleCancelCheckout} color='secondary' variant='text'>
          Cancel
        </Button>
      </Stack>
    </>
  );
}
