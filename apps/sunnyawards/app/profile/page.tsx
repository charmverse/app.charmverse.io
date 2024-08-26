import { getCurrentUser } from '@connect-shared/lib/profile/getCurrentUser';
import { getSession } from '@connect-shared/lib/session/getSession';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ProfilePage } from 'components/profile/ProfilePage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'My Profile'
};

export default async function Profile() {
  const session = await getSession();
  const user = await getCurrentUser(session.user?.id);

  if (!user) {
    return null;
  }

  if (!user?.connectOnboarded) {
    redirect('/welcome');
  }

  return <ProfilePage user={user} />;
}
