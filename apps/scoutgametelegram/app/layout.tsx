import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { AppProviders } from 'components/layout/AppProviders';
import { StickyFooter } from 'components/layout/StickyFooter';
import 'theme/styles.scss';
import { getCachedUserFromSession as getUserFromSession } from 'lib/session/getUserFromSession';

const ClientGlobals = dynamic(() => import('components/common/ClientGlobals').then((comp) => comp.ClientGlobals), {
  ssr: false
});

const appName = 'Scout Game';
const appTitle = 'Scout. Build. Win.';
const appTitleTemplate = '%s - Scout Game';
const appDescription = 'Fantasy sports for onchain builders';

export const metadata: Metadata = {
  applicationName: appName,
  icons: {
    icon: ['/favicon.ico'],
    apple: ['/favicon.ico']
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
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: appName,
    images: 'https://scoutgame.xyz/images/manifest/scoutgame-logo-256.png',
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
  },
  other: {
    robots: 'noindex'
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

  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <body>
        {/* load env vars for the frontend - note that the parent body tag is required for React to not complain */}
        <Script strategy='beforeInteractive' src='/__ENV.js' />
        <AppProviders user={user}>
          <ClientGlobals userId={user?.id} />
          {children}
          <StickyFooter />
        </AppProviders>
      </body>
    </html>
  );
}
