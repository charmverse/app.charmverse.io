import type { Metadata } from 'next';

import { PrivacyPolicyPage } from 'components/info/privacy-policy/PrivacyPolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy'
};

export default async function Info() {
  return <PrivacyPolicyPage />;
}
