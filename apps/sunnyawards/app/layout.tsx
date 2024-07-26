import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import { Footer } from '@connect-shared/components/layout/Footer';
import { getCurrentUserAction } from '@connect-shared/lib/profile/getCurrentUserAction';
import { getSession } from '@connect-shared/lib/session/getSession';
import Box from '@mui/material/Box';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
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
  const session = await getSession();
  const user = session?.user?.id ? await getCurrentUserAction() : null;

  return (
    <html lang='en'>
      <body>
        {/* load env vars for the frontend - note that the parent body tag is required for React to not complain */}
        <Script src='/__ENV.js' strategy='beforeInteractive' />
        <Box component='body' display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh'>
          <AppProviders theme={theme}>
            <Header user={user?.data || null} />
            <Box component='main' bgcolor='mainBackground.main' pb={2}>
              {children}
            </Box>
            <Footer />
          </AppProviders>
        </Box>
      </body>
    </html>
  );
}
