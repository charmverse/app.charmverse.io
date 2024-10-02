import type { Metadata } from 'next';

import { SpamPolicyPage } from 'components/welcome/spam-policy/SpamPolicyPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Spam policy'
};

export default async function SpamPolicy({ searchParams }: { searchParams: { 'profile-github-connect': string } }) {
  const user = await getUserFromSession();

  return <SpamPolicyPage user={user} profileGithubConnect={searchParams['profile-github-connect'] === 'true'} />;
}
