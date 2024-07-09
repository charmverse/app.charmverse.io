import { ProfilePage } from '@connect/components/profile/ProfilePage';
import { getCurrentUser } from '@connect/lib/actions/getCurrentUser';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

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
