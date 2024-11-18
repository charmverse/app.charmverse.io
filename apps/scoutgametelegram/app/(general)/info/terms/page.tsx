import { TermsPage } from '@packages/scoutgame-ui/components/info/terms/TermsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms'
};

export default async function Info() {
  return <TermsPage />;
}
