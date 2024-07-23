import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import { NotificationRequest } from '@connect-shared/components/layout/components/NotificationRequest';
import { Footer } from '@connect-shared/components/layout/Footer';
import { getCurrentUserAction } from '@connect-shared/lib/profile/getCurrentUserAction';
import { getSession } from '@connect-shared/lib/session/getSession';
import Box from '@mui/material/Box';
import { useDatadogLogger } from '@root/hooks/useDatadogLogger';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { Header } from 'components/common/Header/Header';
import { appDescription, appName, appTitle, appTitleTemplate } from 'lib/utils/appDetails';
import theme from 'theme/theme';

import 'theme/cssVariables.scss';

export const metadata: Metadata = {
  applicationName: appName,
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
  themeColor: '#fff'
};
export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUserAction();
  const session = await getSession();
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  useDatadogLogger({ service: 'connect-browser' });

  return (
    <html lang='en' dir='ltr'>
      {/* load env vars for the frontend */}
      <Script src='/__ENV.js' />
      <Box component='body' display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh'>
        <AppProviders theme={theme}>
          <Header user={user?.data || null} />
          {session?.user?.id && <NotificationRequest vapidPublicKey={vapidPublicKey} />}
          <Box component='main' bgcolor='mainBackground.main' pb={2}>
            {children}
          </Box>
          <Footer />
        </AppProviders>
      </Box>
    </html>
  );
}
