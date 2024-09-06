import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { NotificationRequest } from 'components/common/NotificationRequest';
import { getUserFromSession } from 'lib/session/getUserFromSession';
import theme from 'theme/theme';

import 'theme/styles.scss';

const ClientGlobals = dynamic(() => import('components/common/ClientGlobals').then((comp) => comp.ClientGlobals), {
  ssr: false
});

const appName = 'Scout Game';
const appTitle = 'Onchain builder network';
const appTitleTemplate = '%s - Scout Game';
const appDescription = 'Onchain network for connecting web3 developers, projects, organizations';

export const metadata: Metadata = {
  applicationName: appName,
  icons: {
    icon: ['/images/favicon.png'],
    apple: ['/images/favicon.png']
  },
  title: {
    default: `${appName} - ${appTitle}`,
    template: appTitleTemplate
  },
  description: appDescription,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appTitle
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: appName,
    title: {
      default: appTitle,
      template: appTitleTemplate
    },
    description: appDescription
  },
  twitter: {
    card: 'summary',
    title: {
      default: appTitle,
      template: appTitleTemplate
    },
    description: appDescription
  }
};
export const viewport: Viewport = {
  themeColor: '#fff',
  userScalable: false
};
export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getUserFromSession();
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  return (
    <html lang='en' dir='ltr'>
      <body>
        {/* load env vars for the frontend - note that the parent body tag is required for React to not complain */}
        <Script src='/__ENV.js' />
        <AppProviders theme={theme}>
          <ClientGlobals userId={user?.id} />
          <>
            {/* <Box display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh'> */}
            {/* <Header user={user || null} /> */}
            {user?.id && <NotificationRequest vapidPublicKey={vapidPublicKey} />}
            {/* <Box component='main' bgcolor='mainBackground.main' pb={2}> */}
            {children}
            {/* </Box> */}
            {/* </Box> */}
            {/* <StickyFooter /> */}
          </>
        </AppProviders>
      </body>
    </html>
  );
}
