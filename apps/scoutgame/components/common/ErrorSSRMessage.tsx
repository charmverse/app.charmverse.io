import { Alert } from '@mui/material';

export function ErrorSSRMessage({ message }: { message?: string }) {
  return (
    <Alert severity='warning'>
      {message || 'An error occured while loading your data. Please try to refresh or contact us on discord'}
    </Alert>
  );
}
