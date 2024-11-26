import { getCurrentWeek, validateISOWeek } from '@packages/scoutgame/dates';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';

import { HomePage } from 'components/home/HomePage';
import { LandingPage } from 'components/home/LandingPage';

export default async function Home({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getUserFromSession();

  if (!user) {
    return <LandingPage />;
  }

  const tab = searchParams.tab as string | undefined;
  const week = searchParams.week as string | undefined;

  return <HomePage tab={tab || 'leaderboard'} week={week && validateISOWeek(week) ? week : getCurrentWeek()} />;
}
