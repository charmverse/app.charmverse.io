import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';

export default async function Home({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = searchParams.tab as string;
  const user = await getUserFromSession();

  if (!user?.onboardedAt || !user?.agreedToTermsAt) {
    redirect('/welcome');
  }

  return <HomePage tab={tab || 'leaderboard'} />;
}
