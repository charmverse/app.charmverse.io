import getInitColorSchemeScript from '@mui/system/cssVars/getInitColorSchemeScript';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Main } from 'components/common/Main';
import { NavBar } from 'components/Header/Navbar/NavBar';
import { AppProviders } from 'components/providers/AppProviders';

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
          <NavBar />
          <Main>{children}</Main>
        </AppProviders>
      </body>
    </html>
  );
}
