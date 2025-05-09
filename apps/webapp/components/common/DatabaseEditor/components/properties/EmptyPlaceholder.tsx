import { Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function EmptyPlaceholder({ children }: { children: ReactNode }) {
  return (
    <Typography component='span' variant='subtitle2' fontSize={14} color='secondary'>
      {children}
    </Typography>
  );
}
