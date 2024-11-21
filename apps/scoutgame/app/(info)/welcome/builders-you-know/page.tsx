import type { Metadata } from 'next';

import { BuildersYouKnowPage } from 'components/welcome/builders-you-know/BuildersYouKnowPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Builders you know'
};

export default async function BuildersYouKnow() {
  // logic in middleware.ts ensures that user is logged in
  return <BuildersYouKnowPage />;
}
