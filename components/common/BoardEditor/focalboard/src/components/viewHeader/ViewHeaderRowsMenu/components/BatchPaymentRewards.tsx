import PaymentIcon from '@mui/icons-material/Payment';
import { MenuItem, ListItemText } from '@mui/material';

import { PropertyMenu } from './PropertyMenu';

export function BatchPaymentRewards({ onClick }: { onClick: VoidFunction }) {
  return (
    <PropertyMenu
      lastChild={false}
      // add fontSize to icon to override MUI styles
      propertyTemplate={{ icon: <PaymentIcon sx={{ fontSize: '16px !important' }} />, name: 'Send Payment' }}
    >
      <MenuItem onClick={onClick}>
        <ListItemText primary='Send Payment' />
      </MenuItem>
    </PropertyMenu>
  );
}
