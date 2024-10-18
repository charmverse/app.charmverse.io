import type { Metadata } from 'next';

import { SpamPolicyPage } from 'components/welcome/spam-policy/SpamPolicyPage';
import { getCachedUserFromSession as getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Spam policy'
};

export default async function SpamPolicy({ searchParams }: { searchParams: { 'profile-redirect': string } }) {
  const user = await getUserFromSession();

  return <SpamPolicyPage user={user} redirectToProfile={searchParams['profile-redirect'] === 'true'} />;
}
