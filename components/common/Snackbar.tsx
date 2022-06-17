import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import Snackbar, { SnackbarOrigin, SnackbarProps } from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import { useSnackbar } from 'hooks/useSnackbar';
import { forwardRef, useEffect, ReactNode } from 'react';

const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
});

interface CustomizedSnackbarProps {
  autoHideDuration?: number
  severity?: AlertColor,
  message?: string,
  action?: ReactNode,
  origin?: SnackbarOrigin,
  handleClose?: SnackbarProps['onClose'],
  isOpen?: boolean
}

export default function CustomizedSnackbar (props: CustomizedSnackbarProps) {
  const { setIsOpen, severity, message, action, origin, handleClose, isOpen } = useSnackbar();

  // Close the snackbar if we change url
  useEffect(() => {
    setIsOpen(false);
  }, [window.location.href]);

  const {
    action: actionProp,
    handleClose: handleCloseProp,
    isOpen: isOpenProp,
    message: messageProp,
    origin: originProp,
    severity: severityProp,
    autoHideDuration = 5000
  } = props;

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Snackbar
        open={isOpenProp ?? isOpen}
        autoHideDuration={autoHideDuration}
        anchorOrigin={originProp ?? origin}
        onClose={handleClose}
      >
        <Alert onClose={handleCloseProp ?? handleClose as any} severity={severityProp ?? severity} sx={{ width: '100%' }}>
          {messageProp ?? message}
          { actionProp ?? action }
        </Alert>
      </Snackbar>
    </Stack>
  );
}
