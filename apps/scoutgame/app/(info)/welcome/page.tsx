import { log } from '@charmverse/core/log';
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

  if (user?.onboardedAt && !user?.builder) {
    log.debug('Redirect user to onboarding page from Welcome page', { userId: user?.id });
    redirect('/welcome/builder');
  }

  if (user?.agreedToTermsAt) {
    log.debug('Redirect user to home page from Welcome page', { userId: user.id });
    redirect('/');
  }

  // logic in  middleware.ts guarantees that user exists
  return <WelcomePage user={user!} />;
}
