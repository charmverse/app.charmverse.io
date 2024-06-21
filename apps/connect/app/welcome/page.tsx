import type { User } from '@charmverse/core/prisma-client';
import { redirect } from 'next/navigation';

import { WelcomePage } from 'components/welcome/WelcomePage';

export default async function Welcome() {
  const user: Partial<User> & { onboarded: boolean } = { onboarded: false };
  if (!user) {
    redirect('/');
  }

  if (user.onboarded) {
    redirect('/dashboard');
  }

  return <WelcomePage user={user} />;
}
