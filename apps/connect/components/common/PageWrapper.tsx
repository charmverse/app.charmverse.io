import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export function PageWrapper({ children, ...restProps }: BoxProps & { children: ReactNode }) {
  return (
    <Box
      p={3}
      pb={4}
      borderRadius={8}
      bgcolor='background.default'
      border={{ xs: 'none', md: '1px solid var(--charm-palette-divider)' }}
      maxWidth='500px'
      mx='auto'
      my={2}
      {...restProps}
    >
      {children}
    </Box>
  );
}
