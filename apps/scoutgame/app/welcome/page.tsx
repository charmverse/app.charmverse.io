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

  if (!user) {
    log.debug('Redirect user to log in from Welcome page');
    redirect('/');
  }

  if (user?.agreedToTOS) {
    log.debug('Redirect user to home page from Welcome page', { userId: user.id });
    redirect('/');
  }

  return <WelcomePage user={user} />;
}
