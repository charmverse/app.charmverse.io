import { getCurrentUser } from '@connect-shared/lib/profile/getCurrentUser';
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
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  if (user?.connectOnboarded) {
    redirect('/profile');
  }

  return <WelcomePage user={user} />;
}
