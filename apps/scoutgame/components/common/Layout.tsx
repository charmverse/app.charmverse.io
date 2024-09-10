import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export function SinglePageLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      display='grid'
      gridTemplateRows='auto 1fr auto'
      minHeight='100vh'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        justifyContent: { xs: 'space-evenly', sm: 'center' },
        alignItems: 'center',
        textAlign: 'center',
        height: '100%',
        maxHeight: '40em'
      }}
    >
      {children}
    </Box>
  );
}
