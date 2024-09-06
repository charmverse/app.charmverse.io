import { log } from '@charmverse/core/log';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { BuilderWelcomePage } from 'components/welcome/BuilderWelcomePage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function AskAreYouABuilder() {
  const user = await getUserFromSession();

  if (!user) {
    log.debug('Redirect user to log in from Builder Welcome page');
    redirect('/');
  }

  return <BuilderWelcomePage user={user} />;
}
