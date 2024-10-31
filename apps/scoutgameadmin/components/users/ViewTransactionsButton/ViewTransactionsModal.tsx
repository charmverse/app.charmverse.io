import { LoadingButton } from '@mui/lab';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Button,
  TextField,
  CircularProgress,
  InputAdornment,
  Link,
  Typography,
  Box
} from '@mui/material';
import React from 'react';

import { useGetScoutEvents } from 'hooks/api/blockchain';

type Props = {
  open: boolean;
  onClose: () => void;
  scoutId: string;
};

export function ViewTransactionsModal({ open, onClose, scoutId }: Props) {
  const { data, error, isLoading } = useGetScoutEvents(open ? scoutId : '');
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 800 } }} fullWidth>
      <DialogTitle>NFT Purchase transactions</DialogTitle>
      <DialogContent>
        <Box component='pre' maxHeight={600} overflow='auto' fontFamily='monospace' fontSize={12}>
          {JSON.stringify(data, null, 2)}
        </Box>
        {isLoading && <CircularProgress />}
        {error && (
          <Typography variant='caption' color='red'>
            {error.message}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
