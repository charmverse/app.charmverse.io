import type { AlertColor, SnackbarOrigin, SnackbarProps } from '@mui/material';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type IContext = {
  isOpen: boolean;
  actions?: ReactNode[];
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  message: string | null;
  origin: SnackbarOrigin;
  setMessage: Dispatch<SetStateAction<string | null>>;
  severity: AlertColor;
  setSeverity: Dispatch<SetStateAction<AlertColor>>;
  setActions: Dispatch<SetStateAction<ReactNode[]>>;
  setOrigin: Dispatch<SetStateAction<SnackbarOrigin>>;
  showMessage: (msg: string, newSeverity?: AlertColor) => void;
  handleClose: SnackbarProps['onClose'];
};

export const SnackbarContext = createContext<Readonly<IContext>>({
  handleClose: () => {},
  isOpen: false,
  actions: [],
  message: null,
  origin: { vertical: 'bottom', horizontal: 'left' },
  setIsOpen: () => {},
  setMessage: () => {},
  setSeverity: () => {},
  severity: 'info',
  showMessage: () => {},
  setActions: () => {},
  setOrigin: () => {}
});

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [actions, setActions] = useState<ReactNode[]>([]);
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
    setTimeout(() => {
      setOrigin({
        horizontal: 'left',
        vertical: 'bottom'
      });
    }, 500);
  };

  const value = useMemo<IContext>(
    () => ({
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
      actions,
      message,
      origin,
      severity,
      setActions,
      setOrigin,
      setSeverity,
      setIsOpen,
      setMessage
    }),
    [isOpen, message, origin, severity]
  );

  return <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>;
}

export const useSnackbar = () => useContext(SnackbarContext);
