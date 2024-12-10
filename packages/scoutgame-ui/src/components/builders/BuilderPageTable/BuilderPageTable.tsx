import 'server-only';

import { getBuilderActivities } from '@packages/scoutgame/builders/getBuilderActivities';
import { getLeaderboard } from '@packages/scoutgame/builders/getLeaderboard';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { ActivityTable } from './components/ActivityTable';
import { LeaderboardTable } from './components/LeaderboardTable';

export async function BuilderPageTable({ tab, week }: { tab: string; week: string }) {
  if (tab === 'activity') {
    const [, activities = []] = await safeAwaitSSRData(getBuilderActivities({ limit: 100 }));
    return <ActivityTable activities={activities} />;
  }

  if (tab === 'leaderboard') {
    const [, leaderboard = []] = await safeAwaitSSRData(getLeaderboard({ limit: 200, week }));
    return <LeaderboardTable data={leaderboard} week={week} />;
  }
  return null;
}
