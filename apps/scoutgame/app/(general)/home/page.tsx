import { getCurrentWeek, validateISOWeek } from '@packages/scoutgame/dates';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import dynamic from 'next/dynamic';

import { HomePage } from 'components/home/HomePage';

const LandingPage = dynamic(() => import('components/home/LandingPage').then((mod) => mod.LandingPage), { ssr: false });

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
