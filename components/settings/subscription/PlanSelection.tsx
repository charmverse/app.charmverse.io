import { useTheme } from '@emotion/react';
import { Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { AiOutlineUnlock } from 'react-icons/ai';

import type { SubscriptionPeriod } from 'lib/subscription/constants';
import { communityProduct } from 'lib/subscription/constants';

export function PlanSelection({
  disabled,
  period,
  blockQuotaInThousands,
  onSelect,
  onSelectCommited
}: {
  disabled: boolean;
  onSelect: (blockQuotaInThousands: number | null, period: SubscriptionPeriod | null) => void;
  onSelectCommited: (blockQuotaInThousands: number | null, period: SubscriptionPeriod | null) => void;
  period: SubscriptionPeriod;
  blockQuotaInThousands: number;
}) {
  const theme = useTheme();
  const periodNaming = period === 'annual' ? 'yr' : 'mo';
  return (
    <>
      <Stack my={2}>
        <ToggleButtonGroup
          value={period}
          exclusive
          disabled={disabled}
          onChange={(_e, _period) => {
            onSelect(null, _period);
            onSelectCommited(null, _period);
          }}
          aria-label='annual or monthly selection'
        >
          <ToggleButton value='annual' aria-label='left aligned'>
            Yearly (17% off)
          </ToggleButton>
          <ToggleButton value='monthly' aria-label='centered'>
            Monthly
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Stack>
        <InputLabel>Usage</InputLabel>
        <Stack spacing={2} direction='row' alignItems='center' mx={2} mb={1}>
          <Typography>
            ${(communityProduct.pricing[period] ?? 0) * 10}/{periodNaming}
          </Typography>
          <Slider
            disabled={disabled}
            size='small'
            aria-label='Quantity slider'
            valueLabelDisplay='off'
            value={blockQuotaInThousands}
            step={10}
            min={10}
            max={500}
            onChange={(_, value) => onSelect(value as number, null)}
            onChangeCommitted={(_, value) => onSelectCommited(value as number, null)}
          />
          <Typography>
            ${(communityProduct.pricing[period] ?? 0) * 500}/{periodNaming}
          </Typography>
        </Stack>
      </Stack>
      <Stack
        display='flex'
        justifyContent='space-between'
        flexDirection='row'
        alignItems='center'
        maxWidth='400px'
        padding={2}
        mt={2}
        sx={{ border: `1px solid ${theme.palette.secondary.main}` }}
      >
        <Stack>
          <Typography variant='h6' mb={2}>
            Current selection
          </Typography>
          <Typography>{`$${
            (communityProduct.pricing[period] ?? 0) * blockQuotaInThousands
          }/${periodNaming}`}</Typography>
          <Typography>{`${String(communityProduct.blockQuotaIncrement * blockQuotaInThousands).slice(
            0,
            -3
          )}K blocks`}</Typography>
        </Stack>
        <Stack>
          <AiOutlineUnlock size={100} />
        </Stack>
      </Stack>
    </>
  );
}
