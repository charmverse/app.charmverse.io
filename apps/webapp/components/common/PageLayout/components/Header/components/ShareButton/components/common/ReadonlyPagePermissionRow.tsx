import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { GuestChip } from './GuestChip';

type Props = {
  assignee: string;
  value: string;
  isGuest?: boolean;
};

export function ReadonlyPagePermissionRow({ assignee, value, isGuest }: Props) {
  return (
    <Box display='flex' justifyContent='space-between' alignItems='center'>
      <Typography variant='body2'>{assignee}</Typography>
      {isGuest && <GuestChip />}
      <div style={{ width: '160px', textAlign: 'right' }}>
        <Typography color='secondary' variant='caption'>
          {value}
        </Typography>
      </div>
    </Box>
  );
}
