import Box from '@mui/material/Box';

import { Button } from 'components/common/Button';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

export function TokenGateFooter({
  isValid = false,
  onSubmit,
  onCancel
}: {
  isValid?: boolean;
  onSubmit?: () => Promise<void> | void;
  onCancel?: () => void;
}) {
  const { displayedPage } = useTokenGateModal();

  return (
    <Box mb={3} display='flex' justifyContent='flex-end'>
      {onCancel && (
        <Button sx={{ mr: 2 }} variant='outlined' onClick={onCancel}>
          Cancel
        </Button>
      )}
      {onSubmit && (
        <Button onClick={onSubmit} disabled={!isValid}>
          {displayedPage === 'review' ? 'Confirm' : 'Next'}
        </Button>
      )}
    </Box>
  );
}
