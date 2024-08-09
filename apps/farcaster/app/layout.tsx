import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import Box from '@mui/material/Box';
import type { Viewport } from 'next';
import type { ReactNode } from 'react';

import theme from 'theme/theme';

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
          <Box component='main' bgcolor='mainBackground.main' py={6} minHeight='100vh'>
            {children}
          </Box>
        </AppProviders>
      </body>
    </html>
  );
}
