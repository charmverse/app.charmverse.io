import Box from '@mui/material/Box';

import { Button } from 'components/common/Button';

import type { DisplayedPage } from '../hooks/useTokenGateModalContext';

export function TokenGateFooter({
  isValid,
  displayedPage,
  onSubmit,
  onCancel
}: {
  isValid: boolean;
  displayedPage?: DisplayedPage;
  onSubmit: () => Promise<void> | void;
  onCancel?: () => void;
}) {
  return (
    <Box mb={3} display='flex' justifyContent='flex-end'>
      {onCancel && (
        <Button sx={{ mr: 2 }} variant='outlined' onClick={onCancel}>
          Cancel
        </Button>
      )}
      <Button onClick={onSubmit} disabled={!isValid}>
        {displayedPage === 'review' ? 'Confirm' : 'Next'}
      </Button>
    </Box>
  );
}
