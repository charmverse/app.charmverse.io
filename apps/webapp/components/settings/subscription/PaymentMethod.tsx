import { stringUtils } from '@charmverse/core/utilities';
import { useTheme } from '@emotion/react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Elements } from '@stripe/react-stripe-js';

import type { PaymentMethod } from '@packages/lib/subscription/mapStripeFields';

import { ChangeCardDetails } from './ChangeCardDetails';
import { loadStripe } from './loadStripe';

export function PaymentMethod({
  paymentMethod,
  spaceId,
  refetchSubscription
}: {
  paymentMethod?: PaymentMethod | null;
  spaceId: string;
  refetchSubscription: () => void;
}) {
  const theme = useTheme();
  const stripePromise = loadStripe();

  return (
    <Grid container alignItems='center'>
      <Grid item xs={12} sm={8} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
        <Typography variant='h6' mb={1}>
          Payment Method
        </Typography>
        {paymentMethod?.brand && paymentMethod.digits && (
          <Typography>
            {stringUtils.capitalize(paymentMethod.brand)} **** {paymentMethod.digits}
          </Typography>
        )}
        <Elements
          stripe={stripePromise}
          options={{
            appearance: {
              theme: theme.palette.mode === 'dark' ? 'night' : 'stripe'
            }
          }}
        >
          <ChangeCardDetails spaceId={spaceId} refetchSubscription={refetchSubscription} />
        </Elements>
      </Grid>
      <Grid item xs={12} sm={4} />
    </Grid>
  );
}
