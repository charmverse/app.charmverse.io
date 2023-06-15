import type { SubscriptionPeriod } from '@charmverse/core/prisma-client';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';

import type { SubscriptionProductId } from 'lib/subscription/constants';
import { SUBSCRIPTION_PRODUCTS_RECORD, SUBSCRIPTION_PRODUCT_IDS } from 'lib/subscription/constants';

export function PlanSelection({
  disabled,
  period,
  productId,
  onSelect
}: {
  disabled: boolean;
  onSelect: (productId: SubscriptionProductId | null, period: SubscriptionPeriod | null) => void;
  period: SubscriptionPeriod;
  productId: SubscriptionProductId;
}) {
  return (
    <>
      <Stack>
        <InputLabel>Usage</InputLabel>
        <Box mx={2}>
          <Slider
            disabled={disabled}
            size='small'
            aria-label='Product Id'
            valueLabelDisplay='off'
            value={SUBSCRIPTION_PRODUCT_IDS.indexOf(productId)}
            marks={SUBSCRIPTION_PRODUCT_IDS.map((_productId, index) => ({
              value: index,
              label: `$${SUBSCRIPTION_PRODUCTS_RECORD[_productId].pricing[period]}/${period === 'annual' ? 'yr' : 'mo'}`
            }))}
            min={0}
            max={SUBSCRIPTION_PRODUCT_IDS.length - 1}
            onChange={(_, value) => onSelect(SUBSCRIPTION_PRODUCT_IDS[value as number], null)}
          />
        </Box>
      </Stack>
      <Stack>
        <InputLabel>Billing Period</InputLabel>
        <FormControlLabel
          sx={{ width: 'fit-content' }}
          control={
            <Switch
              checked={period === 'annual'}
              onChange={(e) => onSelect(null, e.target.checked ? 'annual' : 'monthly')}
              disabled={disabled}
            />
          }
          label='Annual'
        />
      </Stack>
    </>
  );
}
