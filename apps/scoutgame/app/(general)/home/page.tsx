import { log } from '@charmverse/core/log';
import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Home({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = searchParams.tab as string;
  const user = await getUserFromSession();
  // These two are set separately, so we need to check both of them
  if (!user?.onboardedAt || !user.agreedToTermsAt) {
    log.info('Redirect user to welcome page', { userId: user?.id });
    redirect('/welcome');
  }

  return <HomePage user={user || null} tab={tab || 'leaderboard'} />;
}
