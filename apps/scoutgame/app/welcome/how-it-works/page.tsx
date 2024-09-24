import { log } from '@charmverse/core/log';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { HowItWorksPage } from 'components/welcome/how-it-works/HowItWorksPage';
import { WelcomePage } from 'components/welcome/WelcomePage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'How it works'
};

export default async function HowItWorks() {
  const user = await getUserFromSession();

  if (!user?.onboardedAt) {
    log.debug('Redirect user to onboarding page from Welcome page', { userId: user?.id });
    redirect('/welcome/builder');
  }

  return <HowItWorksPage username={user.username} />;
}
