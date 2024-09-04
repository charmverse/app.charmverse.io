import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import { getCurrentUser } from '@connect-shared/lib/profile/getCurrentUser';
import { getSession } from '@connect-shared/lib/session/getSession';
import Box from '@mui/material/Box';
import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { StickyFooter } from 'components/common/Footer/StickyFooter';
import { Header } from 'components/common/Header/Header';
import { NotificationRequest } from 'components/common/NotificationRequest';
import { appDescription, appName, appTitle, appTitleTemplate } from 'lib/utils/appDetails';
import theme from 'theme/theme';

import 'theme/cssVariables.scss';

const ClientGlobals = dynamic(() => import('components/common/ClientGlobals').then((comp) => comp.ClientGlobals), {
  ssr: false
});

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
  const session = await getSession();
  const user = await getCurrentUser(session.user?.id);
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  return (
    <html lang='en' dir='ltr'>
      <body>
        {/* load env vars for the frontend - note that the parent body tag is required for React to not complain */}
        <Script src='/__ENV.js' />
        <AppProviders theme={theme}>
          <ClientGlobals userId={user?.id} />
          <>
            <Box display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh'>
              <Header user={user || null} />
              {session?.user?.id && <NotificationRequest vapidPublicKey={vapidPublicKey} />}
              <Box component='main' bgcolor='mainBackground.main' pb={2}>
                {children}
              </Box>
            </Box>
            <StickyFooter />
          </>
        </AppProviders>
      </body>
    </html>
  );
}
