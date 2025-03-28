import { getCurrentUser } from '@packages/connect-shared/lib/profile/getCurrentUser';
import { getSession } from '@packages/connect-shared/lib/session/getSession';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { WelcomePage } from 'components/welcome/WelcomePage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function Welcome() {
  const session = await getSession();
  const user = await getCurrentUser(session.user?.id);

  if (!user) {
    return null;
  }

  if (user?.connectOnboarded) {
    redirect('/profile');
  }

  return <WelcomePage user={user} />;
}
