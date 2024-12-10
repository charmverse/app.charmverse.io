import { Box } from '@mui/material';
import { Header } from '@packages/scoutgame-ui/components/common/Navigation/Header';
import { StickyFooter } from '@packages/scoutgame-ui/components/common/Navigation/StickyFooter';
import type { ReactNode } from 'react';

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
