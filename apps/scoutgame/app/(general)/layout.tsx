import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { Header } from 'components/common/Header/Header';
import { StickyFooter } from 'components/layout/StickyFooter';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getUserFromSession();

  return (
    <Box display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh' bgcolor='background.default'>
      <Header user={user || null} />
      <Box component='main' minHeight='100%'>
        {children}
      </Box>
      <StickyFooter />
    </Box>
  );
}
