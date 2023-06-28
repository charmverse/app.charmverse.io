import styled from '@emotion/styled';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import type { SyntheticEvent } from 'react';

export type PaymentType = 'card' | 'crypto';

interface TabPanelProps extends BoxProps {
  index: PaymentType;
  value: PaymentType;
}

export const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButton-root': {
    borderColor: theme.palette.primary.main,
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main
    }
  }
}));

export function PaymentTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role='tabpanel'
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
      py={2}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </Box>
  );
}

export default function PaymentTabs({
  value,
  onChange
}: {
  value: PaymentType;
  onChange: (_event: SyntheticEvent, newValue: PaymentType) => void;
}) {
  return (
    <StyledToggleButtonGroup
      exclusive
      value={value}
      onChange={onChange}
      aria-label='payment options for monthly or annual subscription'
    >
      <ToggleButton value='card' aria-label='card'>
        Card
      </ToggleButton>
      <ToggleButton value='crypto' aria-label='crypto'>
        Crypto
      </ToggleButton>
    </StyledToggleButtonGroup>
  );
}
