import Box from '@mui/material/Box';

import { Button } from 'components/common/Button';

export function TokenGateFooter({
  isValid,
  onSubmit,
  onCancel
}: {
  isValid: boolean;
  onSubmit: () => Promise<void> | void;
  onCancel?: () => void;
}) {
  return (
    <Box mb={3} display='flex' justifyContent='flex-end'>
      {onCancel && (
        <Button sx={{ mr: 2 }} variant='outlined' onClick={onCancel}>
          Back
        </Button>
      )}
      <Button onClick={onSubmit} disabled={!isValid}>
        Next
      </Button>
    </Box>
  );
}
