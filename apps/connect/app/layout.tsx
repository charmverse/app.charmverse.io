import { AppProviders } from '@connect/components/layout/AppProviders';
import { Footer } from '@connect/components/layout/Footer';
import { Header } from '@connect/components/layout/Header';
import { NotificationRequest } from '@connect/components/layout/NotificationRequest';
import { appDescription, appName, appTitle, appTitleTemplate } from '@connect/lib/utils/appDetails';
import Box from '@mui/material/Box';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '@connect/theme/cssVariables.scss';

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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='en' dir='ltr'>
      <Box
        component='body'
        display='grid'
        gridTemplateRows='auto 1fr auto'
        minHeight='100vh'
        bgcolor={{ xs: 'background.default', md: 'grey.200' }}
      >
        <AppProviders>
          <Header />
          <NotificationRequest />
          <Box component='main'>{children}</Box>
          <Footer />
        </AppProviders>
      </Box>
    </html>
  );
}
