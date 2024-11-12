import { log } from '@charmverse/core/log';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
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
  const user = await getUserFromSession();

  if (user?.onboardedAt && user?.agreedToTermsAt && !user?.builderStatus) {
    log.debug('Redirect user to github connect page from Welcome page', { userId: user?.id });
    redirect('/welcome/builder');
  }

  if (user?.agreedToTermsAt && user?.onboardedAt) {
    log.debug('Redirect user to home page from Welcome page', { userId: user.id });
    redirect('/');
  }

  // logic in  middleware.ts guarantees that user exists
  return <WelcomePage user={user!} />;
}
