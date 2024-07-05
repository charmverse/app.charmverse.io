import { AppProviders } from '@connect/components/layout/AppProviders';
import { Footer } from '@connect/components/layout/Footer';
import { Header } from '@connect/components/layout/Header';
import Box from '@mui/material/Box';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@connect/theme/cssVariables.scss';

export const metadata: Metadata = {
  title: 'Charm Connect - Onchain builder network',
  description: 'Onchain network for connecting web3 developers, projects, organizations'
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en'>
      <Box component='body' bgcolor={{ xs: 'background.default', md: 'grey.200' }}>
        <AppProviders>
          <Header />
          <Box component='main'>{children}</Box>
          <Footer />
        </AppProviders>
      </Box>
    </html>
  );
}
