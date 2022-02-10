import { SnackbarProps } from '@mui/material';
import { useState } from 'react';

export default function useSnackbar () {
  const [isOpen, setIsOpen] = useState(false);
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
    showMessage: (msg: string) => {
      handleClick();
      setMessage(msg);
    },
    message
  };
}
