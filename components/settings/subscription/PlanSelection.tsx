import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { InputLabel, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { SubscriptionPeriod } from 'lib/subscription/constants';
import { communityProduct } from 'lib/subscription/constants';
import Lock from 'public/images/subscriptions/lock.svg';

export const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButton-root': {
    borderColor: theme.palette.primary.main,
    '&.Mui-selected': {
      backgroundColor: theme.palette.sidebar.background
    }
  }
}));

export function PlanSelection({
  period,
  blockQuotaInThousands,
  disabled = false,
  onSelect,
  hideSelection
}: {
  disabled?: boolean;
  onSelect: (blockQuotaInThousands: number | null, period: SubscriptionPeriod | null) => void;
  period: SubscriptionPeriod;
  blockQuotaInThousands: number;
  hideSelection?: boolean;
}) {
  const theme = useTheme();
  const price = period === 'annual' ? communityProduct.pricing.annual / 12 : communityProduct.pricing.monthly;

  return (
    <>
      <Stack my={2}>
        <InputLabel sx={{ mb: 1 }} htmlFor='payment-period'>
          Payment Period
        </InputLabel>
        <StyledToggleButtonGroup
          value={period}
          exclusive
          disabled={disabled}
          onChange={(_e, _period) => {
            onSelect(null, _period);
          }}
          aria-label='annual or monthly selection'
          id='payment-period'
        >
          <ToggleButton value='annual' aria-label='left aligned'>
            Yearly (17% off)
          </ToggleButton>
          <ToggleButton value='monthly' aria-label='centered'>
            Monthly
          </ToggleButton>
        </StyledToggleButtonGroup>
      </Stack>
      <Stack>
        <InputLabel>Usage</InputLabel>
        <Stack spacing={2} direction='row' alignItems='center' mx={2} mb={1}>
          <Typography>${price * 10}/mo</Typography>
          <Slider
            disabled={disabled}
            size='small'
            aria-label='Block quota slider'
            valueLabelDisplay='auto'
            valueLabelFormat={(value) => `${value}K blocks`}
            value={blockQuotaInThousands}
            step={10}
            min={10}
            max={500}
            onChange={(_, value) => onSelect(value as number, null)}
          />
          <Typography>${price * 500}/mo</Typography>
        </Stack>
      </Stack>
      {!hideSelection && (
        <Stack
          display='flex'
          justifyContent='space-between'
          flexDirection='row'
          alignItems='center'
          maxWidth='400px'
          padding={2}
          mb={1}
          sx={{ border: `1px solid ${theme.palette.secondary.main}` }}
        >
          <Stack>
            <Typography variant='h6' mb={2}>
              Current selection
            </Typography>
            <Typography>{`$${price * blockQuotaInThousands}/mo`}</Typography>
            <Typography>{`${String(communityProduct.blockQuotaIncrement * blockQuotaInThousands).slice(
              0,
              -3
            )}K blocks`}</Typography>
          </Stack>
          <Stack>
            <Lock width='100px' height='100px' />
          </Stack>
        </Stack>
      )}
    </>
  );
}
