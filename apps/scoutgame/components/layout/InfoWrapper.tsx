import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export function InfoWrapper({ children }: { children: ReactNode }) {
  return (
    <Box maxWidth='700px' height='100%'>
      {children}
    </Box>
  );
}
