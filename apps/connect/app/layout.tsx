import Box from '@mui/material/Box';
import { getIronSession } from 'iron-session';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { AppProviders } from 'components/layout/AppProviders';
import { NotificationRequest } from 'components/layout/components/NotificationRequest';
import { Footer } from 'components/layout/Footer';
import { Header } from 'components/layout/Header';
import 'theme/cssVariables.scss';
import type { SessionData } from 'lib/session/config';
import { getIronOptions } from 'lib/session/config';
import { appDescription, appName, appTitle, appTitleTemplate } from 'lib/utils/appDetails';

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
  const session = await getIronSession<SessionData>(cookies(), getIronOptions());
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  return (
    <html lang='en' dir='ltr'>
      {/* load env vars for the frontend */}
      <Script src='/__ENV.js' />
      <Box
        component='body'
        display='grid'
        gridTemplateRows='auto 1fr auto'
        minHeight='100vh'
        bgcolor={{ xs: 'background.default', md: 'grey.200' }}
      >
        <AppProviders>
          <Header />
          {session?.user?.id && <NotificationRequest vapidPublicKey={vapidPublicKey} />}
          <Box component='main'>{children}</Box>
          <Footer />
        </AppProviders>
      </Box>
    </html>
  );
}
