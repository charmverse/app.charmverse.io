import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import type { ComponentProps } from 'react';

import { DialogTitle, Modal } from 'components/common/Modal';

export interface TestResult {
  message?: string;
  status?: 'loading' | 'error' | 'success';
}

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'>, TestResult {

}

export default function StatusModal ({ status, message, ...props }: Props) {

  if (!status) {
    return null;
  }

  return (
    <Modal size='fluid' {...props}>
      <DialogTitle onClose={props.onClose} sx={!message ? { padding: 0 } : {}}>
        <Box display='flex' gap={1} width={300} alignItems='center'>
          {status === 'success' && (
            <>
              <CheckCircleOutlineIcon color='success' fontSize='large' />
              Success
            </>
          )}
          {status === 'error' && (
            <>
              <ErrorOutlineIcon color='error' fontSize='large' />
              Access denied
            </>
          )}
          {status === 'loading' && (
            <>
              <CircularProgress size={24} />
              Loading
            </>
          )}
        </Box>
      </DialogTitle>
      {message && <Typography>{message}</Typography>}
    </Modal>
  );
}
