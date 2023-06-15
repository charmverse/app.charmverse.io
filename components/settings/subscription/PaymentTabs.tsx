import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { SyntheticEvent } from 'react';

export type PaymentType = 'card' | 'crypto';

interface TabPanelProps extends BoxProps {
  index: PaymentType;
  value: PaymentType;
}

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

function a11yProps(index: PaymentType) {
  return {
    id: `payment-tab-${index}`,
    'aria-controls': `payment-tabpanel-${index}`,
    value: index
  };
}

export default function PaymentTabs({
  value,
  onChange
}: {
  value: PaymentType;
  onChange: (_event: SyntheticEvent, newValue: PaymentType) => void;
}) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      aria-label='payment options for monthly or annual subscription'
      sx={{
        '& > div': {
          flex: '0 0 auto'
        }
      }}
    >
      <Tab label='Card' {...a11yProps('card')} />
      <Tab label='Crypto' {...a11yProps('crypto')} />
    </Tabs>
  );
}
