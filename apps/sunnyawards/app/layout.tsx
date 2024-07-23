import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import { Footer } from '@connect-shared/components/layout/Footer';
import { getCurrentUserAction } from '@connect-shared/lib/profile/getCurrentUserAction';
import Box from '@mui/material/Box';
import { useDatadogLogger } from '@root/hooks/useDatadogLogger';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { Header } from 'components/common/Header/Header';
import theme from 'theme/theme';
import 'theme/cssVariables.scss';

export const metadata: Metadata = {
  title: 'Registration - The Sunny Awards',
  description: 'Onchain network for connecting web3 developers, projects, organizations'
};

export const viewport: Viewport = {
  themeColor: '#fff'
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUserAction();

  useDatadogLogger({ service: 'sunnyawards-browser' });

  return (
    <html lang='en'>
      <Box component='body' display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh'>
        <AppProviders theme={theme}>
          <Header user={user?.data || null} />
          <Box component='main' bgcolor='mainBackground.main' pb={2}>
            {children}
          </Box>
          <Footer />
        </AppProviders>
      </Box>
    </html>
  );
}
