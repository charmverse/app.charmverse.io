import { AppProviders } from '@connect-shared/components/layout/AppProviders';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';

import theme from 'theme/theme';

import 'theme/styles.scss';

const appName = 'Scout Game Admin';

export const metadata: Metadata = {
  applicationName: appName,
  icons: {
    icon: ['/favicon.ico'],
    apple: ['/favicon.ico']
  },
  title: appName,
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: appName,
    images: 'https://scoutgame.xyz/images/manifest/scoutgame-logo-256.png',
    title: appName,
    description: 'Scout. Build. Win.'
  },
  twitter: {
    card: 'summary',
    title: appName,
    description: 'Scout. Build. Win.'
  }
};
export const viewport: Viewport = {
  themeColor: '#000',
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
