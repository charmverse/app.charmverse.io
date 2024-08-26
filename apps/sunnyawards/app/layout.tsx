import { log } from '@charmverse/core/log';
import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import { getCurrentUser } from '@connect-shared/lib/profile/getCurrentUser';
import { getSession } from '@connect-shared/lib/session/getSession';
import Box from '@mui/material/Box';
import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { Footer } from 'components/common/Footer';
import { Header } from 'components/common/Header/Header';
import theme from 'theme/theme';

import 'theme/styles.scss';

export const metadata: Metadata = {
  title: 'Register for The SUNNY Awards',
  description: 'Onchain network for connecting web3 developers, projects, organizations'
};

export const viewport: Viewport = {
  themeColor: '#fff',
  userScalable: false
};

const ClientGlobal = dynamic(() => import('components/common/ClientGlobal').then((comp) => comp.ClientGlobal), {
  ssr: false
});

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getSession();
  const userId = session.user?.id;
  const user = await getCurrentUser(userId);

  if (userId && !user?.id) {
    session.destroy();
    log.warn('User has a session that is not found in the db', { userId });
  }

  return (
    <html lang='en'>
      <body>
        {/* load env vars for the frontend - note that the parent body tag is required for React to not complain */}
        <Script src='/__ENV.js' strategy='beforeInteractive' />
        <AppProviders theme={theme}>
          <ClientGlobal userId={user?.id} />
          <Box display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh' bgcolor='mainBackground.main'>
            <Header user={user || null} />
            <Box component='main' pb={2}>
              {children}
            </Box>
            <Footer />
          </Box>
        </AppProviders>
      </body>
    </html>
  );
}
