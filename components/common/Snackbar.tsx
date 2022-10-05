import ClearIcon from '@mui/icons-material/Clear';
import type { AlertColor, AlertProps } from '@mui/material/Alert';
import MuiAlert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import type { SnackbarOrigin, SnackbarProps } from '@mui/material/Snackbar';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import type { ReactNode } from 'react';
import { forwardRef, useEffect } from 'react';

import { useSnackbar } from 'hooks/useSnackbar';

const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
});

interface CustomizedSnackbarProps {
  autoHideDuration?: number;
  severity?: AlertColor;
  message?: string;
  actions?: ReactNode[];
  origin?: SnackbarOrigin;
  handleClose?: SnackbarProps['onClose'];
  isOpen?: boolean;
}

export default function CustomizedSnackbar (props: CustomizedSnackbarProps) {
  const { setIsOpen, severity, message, actions, origin, handleClose, isOpen } = useSnackbar();

  // Close the snackbar if we change url
  useEffect(() => {
    setIsOpen(false);
  }, [window.location.href]);

  const {
    actions: actionsProp,
    handleClose: handleCloseProp,
    isOpen: isOpenProp,
    message: messageProp,
    origin: originProp,
    severity: severityProp,
    autoHideDuration = 5000
  } = props;

  return (
    <Stack spacing={2} sx={{ width: '100%', position: 'fixed', zIndex: 5000 }}>
      <Snackbar
        open={isOpenProp ?? isOpen}
        autoHideDuration={autoHideDuration}
        anchorOrigin={originProp ?? origin}
        onClose={handleClose}
      >
        <Alert
          action={[
            ...(actionsProp || actions || []),
            <IconButton key='clear' onClick={handleCloseProp ?? handleClose as any} color='inherit'>
              <ClearIcon fontSize='small' />
            </IconButton>
          ]}
          severity={severityProp ?? severity}
          sx={{ width: '100%', alignItems: 'center' }}
        >
          {messageProp ?? message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
