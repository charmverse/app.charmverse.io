import { PrivacyPolicyPage } from '@packages/scoutgame-ui/components/info/privacy-policy/PrivacyPolicyPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy'
};

export default async function Info() {
  return <PrivacyPolicyPage />;
}
