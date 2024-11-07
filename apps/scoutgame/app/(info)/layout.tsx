import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export default function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Box component='main' bgcolor='background.default' p={{ md: 3 }} height='100%' minHeight='100dvh'>
      <Box maxWidth='700px' margin='auto' height='100%'>
        {children}
      </Box>
    </Box>
  );
}
