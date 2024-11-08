import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import { Header } from 'components/common/Header/Header';
import { StickyFooter } from 'components/layout/StickyFooter';

export default async function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Box display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh' bgcolor='background.default' height='100%'>
      <Header />
      <Box component='main' minHeight='100%'>
        {children}
      </Box>
      <StickyFooter />
    </Box>
  );
}
