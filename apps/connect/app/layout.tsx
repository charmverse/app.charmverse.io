import Box from '@mui/material/Box';
import getInitColorSchemeScript from '@mui/system/cssVars/getInitColorSchemeScript';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from 'components/layout/AppProviders';
import { NavBar } from 'components/layout/NavBar';

import 'theme/cssVariables.scss';

export const metadata: Metadata = {
  title: 'Charm Connect - onchain builder network',
  description: 'Onchain network for connecting web3 developers, projects, organizations'
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>
        {getInitColorSchemeScript()}
        <AppProviders>
          <Box component='main' bgcolor='background.default' overflow='auto'>
            {children}
          </Box>
        </AppProviders>
      </body>
    </html>
  );
}
