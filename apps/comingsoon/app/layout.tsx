import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';

import theme from 'theme/theme';

import 'theme/styles.scss';

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
  return (
    <html lang='en' dir='ltr'>
      <body>
        {/* load env vars for the frontend - note that the parent body tag is required for React to not complain */}
        <Script src='/__ENV.js' />
        <AppProviders theme={theme}>{children}</AppProviders>
      </body>
    </html>
  );
}
