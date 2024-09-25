import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { Header } from 'components/common/Header/Header';
import { getUserFromSession } from 'lib/session/getUserFromSession';

// Enforce rendering on client side because the StickyFooter component is rendered based on browser width. In RSC behaviour you see an element that should not be rendered.
const StickyFooter = dynamic(() => import('components/common/Footer/StickyFooter').then((mod) => mod.StickyFooter), {
  ssr: false
});

export default async function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getUserFromSession();

  return (
    <Box display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh' bgcolor='background.default'>
      <Header user={user || null} />
      <Box component='main' minHeight='100%' px={10}>
        {children}
      </Box>
      <StickyFooter />
    </Box>
  );
}
