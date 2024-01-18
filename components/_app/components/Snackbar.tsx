import ClearIcon from '@mui/icons-material/Clear';
import type { AlertColor, AlertProps } from '@mui/material/Alert';
import MuiAlert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import type { SnackbarOrigin, SnackbarProps } from '@mui/material/Snackbar';
import MuiSnackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { forwardRef, useEffect } from 'react';

import { useSnackbar } from 'hooks/useSnackbar';

const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
});

interface CustomizedSnackbarProps {
  autoHideDuration?: number | null;
  severity?: AlertColor;
  message?: string;
  actions?: ReactNode[];
  origin?: SnackbarOrigin;
  handleClose?: SnackbarProps['onClose'];
  isOpen?: boolean;
}

export function Snackbar(props: CustomizedSnackbarProps) {
  const {
    setIsOpen,
    severity,
    message,
    actions,
    handleClose,
    isOpen,
    autoHideDuration = props.autoHideDuration ?? 5000
  } = useSnackbar();
  const router = useRouter();

  // Close the snackbar if we change url
  useEffect(() => {
    // When autoHideDuration is null, we don't want to close the snackbar automatically and instead wait for close action
    if (autoHideDuration !== null) {
      setIsOpen(false);
    }
  }, [router.asPath, autoHideDuration]);

  const {
    actions: actionsProp,
    handleClose: handleCloseProp,
    isOpen: isOpenProp,
    message: messageProp,
    origin: originProp = { vertical: 'bottom', horizontal: 'left' },
    severity: severityProp
  } = props;

  return (
    <Stack spacing={2} sx={{ width: '100%', position: 'fixed', zIndex: 5000 }}>
      <MuiSnackbar
        open={isOpenProp ?? isOpen}
        autoHideDuration={autoHideDuration}
        anchorOrigin={originProp ?? origin}
        onClose={handleClose}
        sx={{
          '& .MuiAlert-action': {
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        <Alert
          action={[
            ...(actionsProp || actions || []),
            <IconButton key='clear' onClick={handleCloseProp ?? (handleClose as any)} color='inherit'>
              <ClearIcon fontSize='small' />
            </IconButton>
          ]}
          severity={severityProp ?? severity}
          sx={{ width: '100%', alignItems: 'center' }}
        >
          {messageProp ?? message}
        </Alert>
      </MuiSnackbar>
    </Stack>
  );
}
