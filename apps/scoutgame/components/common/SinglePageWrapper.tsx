import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export function SinglePageWrapper({ children }: { children: ReactNode }) {
  return (
    <Box
      position='relative'
      borderRadius={{ xs: 0, md: 2 }}
      bgcolor='background.light'
      border={{ xs: 'none', sm: '1px solid var(--charm-palette-divider)' }}
      maxWidth='700px'
      height='100%'
      textAlign='left'
      mx='auto'
      p={3}
    >
      {children}
    </Box>
  );
}
