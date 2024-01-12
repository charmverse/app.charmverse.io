import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Button } from 'components/common/Button';

import { useTwoFactorAuth } from '../hooks/useTwoFactorAuth';

export function FinishScreen() {
  const { handleClose, data, error } = useTwoFactorAuth();

  if (!data?.recoveryCode) {
    return <Alert severity='error'>{error?.message || 'Something went wrong. Please contact our support team.'}</Alert>;
  }

  return (
    <Box>
      <Typography>Backup Codes</Typography>
      <Typography mb={2}>Save this single-use backup code in a safe place.</Typography>
      <Typography mb={2}>{data?.recoveryCode}</Typography>
      <Typography mb={2}>
        The backup code lets you log in to CharmVerse if you don't have access to your authenticator app.
      </Typography>
      <Button onClick={handleClose}>CONFIRM</Button>
    </Box>
  );
}
