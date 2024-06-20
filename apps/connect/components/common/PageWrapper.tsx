import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <Box
      p={4}
      borderRadius={10}
      bgcolor='background.default'
      boxShadow={3}
      maxWidth='70rem'
      mx={{ xs: 2, md: 4, lg: 'auto' }}
      my={{ xs: 2, md: 8 }}
    >
      {children}
    </Box>
  );
}
