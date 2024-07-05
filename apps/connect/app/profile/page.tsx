import { ProfilePage } from '@connect/components/profile/ProfilePage';
import { getCurrentUser } from '@connect/lib/actions/getCurrentUser';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

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
