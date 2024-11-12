'use client';

import type { AlertColor, SnackbarCloseReason } from '@mui/material';
import { Alert, Snackbar } from '@mui/material';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type SnackbarContext = {
  showMessage: (message: string, severity?: AlertColor) => void;
  snackbarOpen: boolean;
};

export const SnackbarContext = createContext<Readonly<SnackbarContext | null>>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('info');

  const showMessage = useCallback((message: string, severity: AlertColor = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }

    setSnackbarOpen(false);
    setSnackbarMessage('');
    setSnackbarSeverity('info');
  }, []);

  const value = useMemo(() => ({ showMessage, handleClose, snackbarOpen }), [showMessage, handleClose, snackbarOpen]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        onClose={handleClose}
        autoHideDuration={6000}
        data-test={`snackbar-${snackbarSeverity}`}
      >
        <Alert onClose={handleClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }

  return context;
}
