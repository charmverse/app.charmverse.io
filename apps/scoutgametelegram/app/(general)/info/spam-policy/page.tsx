import { SpamPolicyPage } from '@packages/scoutgame-ui/components/info/pages/SpamPolicyPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spam Policy'
};

export default async function SpamPolicy() {
  return <SpamPolicyPage />;
}
