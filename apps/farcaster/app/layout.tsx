import Box from '@mui/material/Box';
import { AppProviders } from '@packages/connect-shared/components/layout/AppProviders';
import type { Viewport } from 'next';
import type { ReactNode } from 'react';

import theme from 'theme/theme';

import { GlobalComponent } from '../components/common/GlobalComponent';

import 'theme/cssVariables.scss';

export const viewport: Viewport = {
  themeColor: '#fff',
  userScalable: false
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
          <Box component='main' bgcolor='background.default' py={6} minHeight='100vh'>
            <GlobalComponent />
            {children}
          </Box>
        </AppProviders>
      </body>
    </html>
  );
}
