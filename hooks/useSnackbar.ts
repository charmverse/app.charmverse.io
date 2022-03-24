import { AlertColor, SnackbarProps } from '@mui/material';
import { useState } from 'react';

export default function useSnackbar () {
  const [isOpen, setIsOpen] = useState(false);
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [message, setMessage] = useState<null | string>(null);

  const handleClick = () => {
    setIsOpen(true);
  };

  const handleClose: SnackbarProps['onClose'] = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setIsOpen(false);
  };

  return {
    isOpen,
    handleClose,
    showMessage: (msg: string, newSeverity?: AlertColor) => {
      handleClick();
      if (newSeverity) {
        setSeverity(newSeverity);
      }
      setMessage(msg);
    },
    message,
    severity,
    setSeverity
  };
}
