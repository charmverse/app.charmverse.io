import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import Snackbar, { SnackbarProps } from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import { useSnackbar } from 'hooks/useSnackbar';
import * as React from 'react';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
});

interface CustomizedSnackbarProps {
  autoHideDuration?: number
}

export default function CustomizedSnackbar (props: CustomizedSnackbarProps) {
  const { severity, message, handleClose, isOpen, showMessage } = useSnackbar();

  const { autoHideDuration = 5000 } = props;
  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Snackbar open={isOpen} autoHideDuration={autoHideDuration} onClose={handleClose}>
        <Alert onClose={handleClose as any} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
