import Box from '@mui/material/Box';

import { Button } from 'components/common/Button';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

export function TokenGateFooter({
  isValid = true,
  onSubmit,
  onCancel,
  loading = false
}: {
  isValid?: boolean;
  loading?: boolean;
  onSubmit?: () => Promise<void> | void;
  onCancel?: () => void;
}) {
  const { displayedPage } = useTokenGateModal();

  return (
    <Box mb={3} display='flex' justifyContent='flex-end'>
      {onCancel && (
        <Button sx={{ mr: 2 }} variant='outlined' onClick={onCancel}>
          {displayedPage === 'review' ? 'Cancel' : 'Back'}
        </Button>
      )}
      {onSubmit && (
        <Button onClick={onSubmit} disabled={!isValid || loading} loading={loading}>
          {displayedPage === 'review' ? 'Confirm' : 'Next'}
        </Button>
      )}
    </Box>
  );
}
