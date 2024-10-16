import type { Metadata } from 'next';

import { SpamPolicyPage } from 'components/info/pages/SpamPolicyPage';

export const metadata: Metadata = {
  title: 'Spam Policy'
};

export default async function SpamPolicy() {
  return <SpamPolicyPage />;
}
