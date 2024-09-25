import type { Metadata } from 'next';

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

  if (user?.builder) {
    log.debug('Redirect user to onboarding page from Welcome page', { userId: user?.id });
    redirect('/spam-policy');
  }
  return <BuilderPage />;
}
