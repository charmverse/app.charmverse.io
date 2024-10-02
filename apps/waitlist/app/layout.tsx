import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import Box from '@mui/material/Box';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import theme from 'theme/theme';

import { GlobalComponent } from '../components/common/GlobalComponent';

import 'theme/cssVariables.scss';

export const viewport: Viewport = {
  themeColor: '#fff',
  userScalable: false
};

export const metadata: Metadata = {
  applicationName: 'Scout Game Waitlist',
  title: 'Scout Game Waitlist',
  openGraph: {
    type: 'website',
    siteName: 'Join the waitlist',
    images: 'https://scoutgame.xyz/images/manifest/scoutgame-logo-256.png',
    title: 'Scout Game'
  },
  twitter: {
    card: 'summary',
    title: 'Scout Game',
    description: 'Join the waitlist'
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en' dir='ltr'>
      <body>
        <AppProviders theme={theme}>
          <Box component='main' bgcolor='background.default' pb={2} minHeight='100vh'>
            <GlobalComponent />
            {children}
          </Box>
        </AppProviders>
      </body>
    </html>
  );
}
