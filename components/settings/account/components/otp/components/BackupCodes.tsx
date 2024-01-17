import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Button } from 'components/common/Button';

type Props = {
  recoveryCode?: string;
  errorMessage?: string;
  loading?: boolean;
  onSubmit: () => Promise<void> | void;
};

export function BackupCodes({ recoveryCode, errorMessage, loading, onSubmit }: Props) {
  if (errorMessage || !recoveryCode) {
    return <Alert severity='error'>{errorMessage || 'Something went wrong. Please contact our support team.'}</Alert>;
  }

  return (
    <Box>
      <Typography>Backup Codes</Typography>
      <Typography mb={2}>Save this single-use backup code in a safe place.</Typography>
      <Typography mb={2}>{recoveryCode}</Typography>
      <Typography mb={2}>
        The backup code lets you log in to CharmVerse if you don't have access to your authenticator app.
      </Typography>
      <Button onClick={onSubmit} loading={loading} disabled={loading} data-test='two-factor-auth-next'>
        Confirm
      </Button>
    </Box>
  );
}
