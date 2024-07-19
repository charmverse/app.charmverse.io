import Box from '@mui/material/Box';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from 'components/layout/AppProviders';
import { Footer } from 'components/layout/Footer';
import { Header } from 'components/layout/Header';

import 'theme/cssVariables.scss';

export const metadata: Metadata = {
  title: 'Registration - The Sunny Awards',
  description: 'Onchain network for connecting web3 developers, projects, organizations'
};

export const viewport: Viewport = {
  themeColor: '#fff'
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en'>
      <Box component='body' display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh'>
        <AppProviders>
          <Header />
          <Box component='main' bgcolor='mainBackground.main' pb={2}>
            {children}
          </Box>
          <Footer />
        </AppProviders>
      </Box>
    </html>
  );
}
