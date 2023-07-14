import { stringUtils } from '@charmverse/core/utilities';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import Link from 'components/common/Link';
import type { PaymentMethodWithUpdateUrl } from 'lib/subscription/mapStripeFields';

export function PaymentMethod({ paymentMethod }: { paymentMethod: PaymentMethodWithUpdateUrl }) {
  return (
    <Grid container alignItems='center'>
      <Grid item xs={12} sm={8} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
        <Typography variant='h6' mb={1}>
          Payment Method
        </Typography>
        <Typography>
          {paymentMethod.type === 'card' &&
            `${stringUtils.capitalize(paymentMethod?.brand || '')} **** ${paymentMethod.digits}`}
          {paymentMethod.type === 'us_bank_account' && `ACH Debit **** ${paymentMethod.digits}`}
        </Typography>
        {paymentMethod.updateUrl && (
          <Link external href={paymentMethod.updateUrl}>
            Update your payment details
          </Link>
        )}
      </Grid>
      <Grid item xs={12} sm={4} />
    </Grid>
  );
}
