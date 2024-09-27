import type { Metadata } from 'next';

import { TermsPage } from 'components/info/terms/TermsPage';

export const metadata: Metadata = {
  title: 'Terms'
};

export default async function Info() {
  return <TermsPage />;
}
