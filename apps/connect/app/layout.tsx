import Box from '@mui/material/Box';
import getInitColorSchemeScript from '@mui/system/cssVars/getInitColorSchemeScript';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from 'components/layout/AppProviders';

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
      <Box component='body' bgcolor={{ xs: 'background.default', md: 'grey.200' }}>
        {getInitColorSchemeScript()}
        <AppProviders>
          <Box component='main'>{children}</Box>
        </AppProviders>
      </Box>
    </html>
  );
}
