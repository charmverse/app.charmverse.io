import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export function SinglePageLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        justifyContent: { xs: 'space-evenly', sm: 'center' },
        alignItems: 'center',
        textAlign: 'center',
        height: '100%',
        minHeight: 'calc(100svh - 48px)'
      }}
    >
      {children}
    </Box>
  );
}
