import { WelcomePage } from '@connect/components/welcome/WelcomePage';
import { getCurrentUser } from '@connect/lib/actions/getCurrentUser';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  }
};

export default async function Welcome() {
  const user = await getCurrentUser();

  if (!user?.data) {
    return null;
  }

  if (user?.data?.connectOnboarded) {
    redirect('/profile');
  }

  return <WelcomePage user={user.data} />;
}
