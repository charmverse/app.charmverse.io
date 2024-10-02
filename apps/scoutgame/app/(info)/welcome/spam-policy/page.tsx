import type { Metadata } from 'next';

import { SpamPolicyPage } from 'components/welcome/spam-policy/SpamPolicyPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Spam policy'
};

export default async function SpamPolicy({ searchParams }: { searchParams: { onboarding: string } }) {
  return <SpamPolicyPage onboarding={searchParams.onboarding === 'true'} />;
}
