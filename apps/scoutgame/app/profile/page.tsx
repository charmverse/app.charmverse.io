import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ProfilePage } from 'components/profile/ProfilePage';
import { getCurrentUserAction } from 'lib/user/getCurrentUserAction';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'My Profile'
};

export default async function Profile() {
  const user = await getCurrentUserAction();

  if (!user?.data) {
    redirect('/');
  }

  if (!user?.data?.onboarded) {
    redirect('/welcome');
  }

  return <ProfilePage user={user.data} />;
}
