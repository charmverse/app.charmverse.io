import { AlertColor, SnackbarProps } from '@mui/material';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from 'react';

type IContext = {
  isOpen: boolean,
  setIsOpen: Dispatch<SetStateAction<boolean>>
  message: string | null
  setMessage: Dispatch<SetStateAction<string | null>>
  severity: AlertColor
  setSeverity: Dispatch<SetStateAction<AlertColor>>
  showMessage: (msg: string, newSeverity?: AlertColor) => void
  handleClose: SnackbarProps['onClose']
}

export const SnackbarContext = createContext<Readonly<IContext>>({
  handleClose: () => {},
  isOpen: false,
  message: null,
  setIsOpen: () => {},
  setMessage: () => {},
  setSeverity: () => {},
  severity: 'info',
  showMessage: () => {}
});

export function SnackbarProvider ({ children }: {children: ReactNode}) {
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

  const value: IContext = useMemo(() => ({
    isOpen,
    handleClose,
    showMessage: (msg: string, newSeverity?: AlertColor) => {
      newSeverity = newSeverity ?? 'info';
      handleClick();
      if (newSeverity) {
        setSeverity(newSeverity);
      }
      setMessage(msg);
    },
    message,
    severity,
    setSeverity,
    setIsOpen,
    setMessage
  }), [isOpen, message, severity]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
    </SnackbarContext.Provider>
  );

}

export const useSnackbar = () => useContext(SnackbarContext);
