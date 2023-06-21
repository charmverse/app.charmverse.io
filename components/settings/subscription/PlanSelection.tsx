import type { SubscriptionPeriod } from '@charmverse/core/prisma-client';
import { useTheme } from '@emotion/react';
import { Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { AiOutlineUnlock } from 'react-icons/ai';

import { communityProduct } from 'lib/subscription/constants';

export function PlanSelection({
  disabled,
  period,
  blockQuota,
  onSelect,
  onSelectCommited
}: {
  disabled: boolean;
  onSelect: (blockQuota: number | null, period: SubscriptionPeriod | null) => void;
  onSelectCommited: (quanity: number | null, period: SubscriptionPeriod | null) => void;
  period: SubscriptionPeriod;
  blockQuota: number;
}) {
  const theme = useTheme();

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
          <Typography>${communityProduct.pricing[period]}/mo</Typography>
          <Slider
            disabled={disabled}
            size='small'
            aria-label='Quantity slider'
            valueLabelDisplay='off'
            value={blockQuota}
            step={1}
            min={1}
            max={50}
            onChange={(_, value) => onSelect(value as number, null)}
            onChangeCommitted={(_, value) => onSelectCommited(value as number, null)}
          />
          <Typography>${(communityProduct.pricing[period] ?? 0) * 50}/mo</Typography>
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
          <Typography>{`$${(communityProduct.pricing[period] ?? 0) * blockQuota}/mo`}</Typography>
          <Typography>{`${communityProduct.blockLimit * blockQuota} blocks`}</Typography>
        </Stack>
        <Stack>
          <AiOutlineUnlock size={100} />
        </Stack>
      </Stack>
    </>
  );
}
