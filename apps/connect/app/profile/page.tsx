import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ProfilePage } from 'components/profile/ProfilePage';
import { getCurrentUser } from 'lib/actions/getCurrentUser';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  }
};

export default async function Profile() {
  const user = await getCurrentUser();

  if (!user?.data) {
    redirect('/');
  }

  if (!user?.data?.connectOnboarded) {
    redirect('/welcome');
  }

  return <ProfilePage user={user.data} />;
}
