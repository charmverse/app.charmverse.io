import { log } from '@charmverse/core/log';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { BuilderPage } from 'components/welcome/builder/BuilderWelcomePage';
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

  if (user?.builderStatus) {
    log.debug('Redirect existing builder to Spam policy page from Builder page', { userId: user?.id });
    redirect('/spam-policy');
  }
  return <BuilderPage />;
}
