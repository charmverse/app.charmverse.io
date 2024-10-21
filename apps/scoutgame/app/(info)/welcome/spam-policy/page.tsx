import type { Metadata } from 'next';

import { SpamPolicyPage } from 'components/welcome/spam-policy/SpamPolicyPage';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Spam policy'
};

export default async function SpamPolicy({ searchParams }: { searchParams: { 'profile-redirect': string } }) {
  return <SpamPolicyPage redirectToProfile={searchParams['profile-redirect'] === 'true'} />;
}
