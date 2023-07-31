import type { AlertColor, SnackbarOrigin, SnackbarProps } from '@mui/material';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type IContext = {
  isOpen: boolean;
  actions?: ReactNode[];
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  message: ReactNode;
  origin: SnackbarOrigin;
  setMessage: Dispatch<SetStateAction<ReactNode>>;
  severity: AlertColor;
  setSeverity: Dispatch<SetStateAction<AlertColor>>;
  setActions: Dispatch<SetStateAction<ReactNode[]>>;
  showMessage: (msg: ReactNode, newSeverity?: AlertColor) => void;
  handleClose: SnackbarProps['onClose'];
  autoHideDuration: number | null;
  setAutoHideDuration: Dispatch<SetStateAction<number | null>>;
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
  autoHideDuration: 5000,
  setAutoHideDuration: () => {}
});

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [actions, setActions] = useState<ReactNode[]>([]);
  const [origin, setOrigin] = useState<SnackbarOrigin>({ vertical: 'bottom', horizontal: 'left' });
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [message, setMessage] = useState<null | ReactNode>(null);
  const [autoHideDuration, setAutoHideDuration] = useState<null | number>(5000);

  const resetState = () => {
    setIsOpen(false);
    setActions([]);
    setOrigin({ vertical: 'bottom', horizontal: 'left' });
    setMessage(null);
    setAutoHideDuration(5000);
    setSeverity('info');
  };

  const handleClose: SnackbarProps['onClose'] = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    resetState();
  };

  const value = useMemo<IContext>(
    () => ({
      autoHideDuration,
      setAutoHideDuration,
      isOpen,
      handleClose,
      showMessage: (msg: ReactNode, newSeverity?: AlertColor, anchorOrigin?: SnackbarOrigin) => {
        newSeverity = newSeverity ?? 'info';
        setIsOpen(true);
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
      setSeverity,
      setIsOpen,
      setMessage
    }),
    [isOpen, message, origin, severity]
  );

  return <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>;
}

export const useSnackbar = () => useContext(SnackbarContext);
