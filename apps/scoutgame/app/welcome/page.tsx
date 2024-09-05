import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { WelcomePage } from 'components/welcome/WelcomePage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function Welcome() {
  const user = await getUserFromSession();

  if (!user?.data) {
    return null;
  }

  if (user?.data?.onboarded) {
    redirect('/profile');
  }

  return <WelcomePage user={user.data} />;
}
