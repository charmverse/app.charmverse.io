'use client';

import { log } from '@charmverse/core/log';
import { Alert } from '@mui/material';
import { useEffect } from 'react';

export function ErrorSSRMessage({ message }: { message?: string }) {
  useEffect(() => {
    log.error('Error in SSR data fetching. Please refresh.');
  }, []);

  return (
    <Alert severity='warning'>
      {message || 'An error occurred while loading your data. Please try to refresh or contact us on Discord'}
    </Alert>
  );
}
