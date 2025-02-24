import { getCurrentUser } from '@packages/connect-shared/lib/profile/getCurrentUser';
import { getSession } from '@packages/connect-shared/lib/session/getSession';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { InvalidUser } from 'components/common/InvalidUser';
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
    return <InvalidUser />;
  }

  if (!user?.connectOnboarded) {
    redirect('/welcome');
  }

  return <ProfilePage user={user} />;
}
