import type { AlertColor, SnackbarOrigin, SnackbarProps } from '@mui/material';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type IContext = {
  isOpen: boolean;
  actions?: ReactNode[];
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  message: ReactNode;
  setMessage: Dispatch<SetStateAction<ReactNode>>;
  severity: AlertColor;
  setSeverity: Dispatch<SetStateAction<AlertColor>>;
  setActions: Dispatch<SetStateAction<ReactNode[]>>;
  showMessage: (msg: ReactNode, newSeverity?: AlertColor) => void;
  showError: (error: any, defaultMessage?: string) => void;
  handleClose: SnackbarProps['onClose'];
  autoHideDuration: number | null;
  setAutoHideDuration: Dispatch<SetStateAction<number | null>>;
};

export const SnackbarContext = createContext<Readonly<IContext>>({
  handleClose: () => {},
  isOpen: false,
  actions: [],
  message: null,
  setIsOpen: () => {},
  setMessage: () => {},
  setSeverity: () => {},
  severity: 'info',
  showMessage: () => {},
  showError: () => {},
  setActions: () => {},
  autoHideDuration: 5000,
  setAutoHideDuration: () => {}
});

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [actions, setActions] = useState<ReactNode[]>([]);
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [message, setMessage] = useState<null | ReactNode>(null);
  const [autoHideDuration, setAutoHideDuration] = useState<null | number>(5000);

  const resetState = () => {
    setIsOpen(false);
    setActions([]);
    setAutoHideDuration(5000);
  };

  const handleClose: SnackbarProps['onClose'] = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    resetState();
  };

  function showMessage(msg: ReactNode, newSeverity?: AlertColor) {
    newSeverity = newSeverity ?? 'info';
    setMessage(msg);
    setSeverity(newSeverity);
    setIsOpen(true);
  }

  // error can be a string or instance of Error
  function showError(error: any, defaultMessage?: string) {
    // error?.errorType is from our webapp api, ex 404 response
    const errorMessage = error?.message || error?.errorType || (typeof error === 'string' ? error : defaultMessage);
    showMessage(errorMessage, 'error');
  }

  const value = useMemo<IContext>(
    () => ({
      autoHideDuration,
      setAutoHideDuration,
      isOpen,
      handleClose,
      showMessage,
      showError,
      actions,
      message,
      severity,
      setActions,
      setSeverity,
      setIsOpen,
      setMessage
    }),
    [isOpen, message, autoHideDuration, actions, severity]
  );

  return <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>;
}

export const useSnackbar = () => useContext(SnackbarContext);
