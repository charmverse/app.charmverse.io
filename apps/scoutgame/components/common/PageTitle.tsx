import { Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <Typography align='center' variant='h3' component='h1'>
      {children}
    </Typography>
  );
}
