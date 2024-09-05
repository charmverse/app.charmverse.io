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

  if (!user?.data) {
    redirect('/');
  }

  if (!user?.data?.onboarded) {
    redirect('/welcome');
  }

  return <ProfilePage user={user.data} />;
}
