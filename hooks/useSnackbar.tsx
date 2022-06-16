import { AlertColor, SnackbarOrigin, SnackbarProps } from '@mui/material';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from 'react';

type IContext = {
  isOpen: boolean,
  action?: ReactNode,
  setIsOpen: Dispatch<SetStateAction<boolean>>
  message: string | null
  origin: SnackbarOrigin
  setMessage: Dispatch<SetStateAction<string | null>>
  severity: AlertColor
  setSeverity: Dispatch<SetStateAction<AlertColor>>
  showMessage: (msg: string, newSeverity?: AlertColor) => void
  handleClose: SnackbarProps['onClose']
}

export const SnackbarContext = createContext<Readonly<IContext>>({
  handleClose: () => {},
  isOpen: false,
  action: null,
  message: null,
  origin: { vertical: 'bottom', horizontal: 'left' },
  setIsOpen: () => {},
  setMessage: () => {},
  setSeverity: () => {},
  severity: 'info',
  showMessage: () => {}
});

export function SnackbarProvider ({ children }: {children: ReactNode}) {
  const [isOpen, setIsOpen] = useState(true);
  const [action, setAction] = useState<ReactNode>(null);
  const [origin, setOrigin] = useState<SnackbarOrigin>({ vertical: 'bottom', horizontal: 'left' });
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
    showMessage: (msg: string, newSeverity?: AlertColor, anchorOrigin?: SnackbarOrigin) => {
      newSeverity = newSeverity ?? 'info';

      handleClick();
      if (anchorOrigin) {
        setOrigin(anchorOrigin);
      }
      setSeverity(newSeverity);
      setMessage(msg);
    },
    message,
    action,
    origin,
    severity,
    setAction,
    setOrigin,
    setSeverity,
    setIsOpen,
    setMessage
  }), [isOpen, message, origin, severity]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
    </SnackbarContext.Provider>
  );

}

export const useSnackbar = () => useContext(SnackbarContext);
