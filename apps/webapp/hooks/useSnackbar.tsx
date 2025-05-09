import type { AlertColor, SnackbarProps } from '@mui/material';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useCharmRouter } from './useCharmRouter';

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

const defaultAutoHideDuration = 5000;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [actions, setActions] = useState<ReactNode[]>([]);
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [message, setMessage] = useState<null | ReactNode>(null);
  const [autoHideDuration, setAutoHideDuration] = useState<null | number>(defaultAutoHideDuration);

  const { router, updateURLQuery } = useCharmRouter();

  const resetState = () => {
    setIsOpen(false);
    setActions([]);
    setAutoHideDuration(defaultAutoHideDuration);
  };

  const handleClose: SnackbarProps['onClose'] = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    resetState();
  };

  const showMessage = useCallback(
    (msg: ReactNode, newSeverity?: AlertColor) => {
      newSeverity = newSeverity ?? 'info';
      setMessage(msg);
      setSeverity(newSeverity);
      setIsOpen(true);
    },
    [setIsOpen, setMessage, setSeverity]
  );

  // error can be a string or instance of Error
  function showError(error: any, defaultMessage?: string) {
    // error?.errorType is from our webapp api, ex 404 response
    const errorMessage = error?.message || error?.errorType || (typeof error === 'string' ? error : defaultMessage);
    showMessage(errorMessage, 'error');
  }

  useEffect(() => {
    if (router.query.callbackError) {
      showMessage(decodeURIComponent(router.query.callbackError as string), 'error');

      setTimeout(() => {
        updateURLQuery({ callbackError: null });
      }, defaultAutoHideDuration);
    }
  }, [router.query.callbackError]);

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
    [isOpen, message, showMessage, autoHideDuration, actions, severity]
  );

  return <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>;
}

export const useSnackbar = () => useContext(SnackbarContext);
