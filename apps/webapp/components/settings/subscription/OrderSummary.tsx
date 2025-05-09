import { Divider, Stack, Typography } from '@mui/material';
import type { FormEvent, ReactNode } from 'react';

import { Button } from 'components/common/Button';
import type { SubscriptionPeriod } from '@packages/lib/subscription/constants';
import { generatePriceDetails } from '@packages/lib/subscription/generatePriceDetails';
import type { CouponDetails } from '@packages/lib/subscription/getCouponDetails';

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
          <Typography variant='body2' mb={1}>
            {blockQuota}K blocks
          </Typography>
          <Typography variant='body2'>Billed {period === 'annual' ? 'annually' : 'monthly'}</Typography>
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
