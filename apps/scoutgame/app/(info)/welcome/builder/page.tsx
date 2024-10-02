import type { Metadata } from 'next';

import { BuilderPage } from 'components/welcome/builder/BuilderWelcomePage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function AskAreYouABuilder() {
  return <BuilderPage />;
}
