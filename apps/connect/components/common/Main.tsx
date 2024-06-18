import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export function Main({ children }: { children: ReactNode }) {
  return (
    <Box component='main' bgcolor='background.default' overflow='auto'>
      {children}
    </Box>
  );
}
