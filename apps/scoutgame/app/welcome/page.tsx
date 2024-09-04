import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { WelcomePage } from 'components/welcome/WelcomePage';
import { getCurrentUserAction } from 'lib/user/getCurrentUserAction';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function Welcome() {
  const user = await getCurrentUserAction();

  if (!user?.data) {
    return null;
  }

  if (user?.data?.connectOnboarded) {
    redirect('/profile');
  }

  return <WelcomePage user={user.data} />;
}
