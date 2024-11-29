import { getCurrentWeek, validateISOWeek } from '@packages/scoutgame/dates';

import { BuildersPage } from 'components/builders/BuildersPage';

export default async function Builders({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = (searchParams.tab as string) || 'leaderboard';
  const week = searchParams.week as string | undefined;

  return <BuildersPage tab={tab} week={week && validateISOWeek(week) ? week : getCurrentWeek()} />;
}
