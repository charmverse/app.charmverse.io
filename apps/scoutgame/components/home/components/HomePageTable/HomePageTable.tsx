import 'server-only';

import { getBuilderActivities } from '@packages/scoutgame/builders/getBuilderActivities';
import { getRankedNewScoutsForCurrentWeek } from '@packages/scoutgame/users/getNewScouts';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { getLeaderboard } from 'lib/builders/getLeaderboard';
import { getTopBuilders } from 'lib/builders/getTopBuilders';
import { getTopScouts } from 'lib/scouts/getTopScouts';

import { ActivityTable } from './components/ActivityTable';
import { LeaderboardTable } from './components/LeaderboardTable';
import { NewScoutsTable } from './components/NewScoutsTable';
import { TopBuildersTable } from './components/TopBuildersTable';
import { TopScoutsTable } from './components/TopScoutsTable';

export async function HomeTab({ tab }: { tab: string }) {
  if (tab === 'activity') {
    const [, activities = []] = await safeAwaitSSRData(getBuilderActivities({ limit: 100 }));
    return <ActivityTable activities={activities} />;
  }

  if (tab === 'top-scouts') {
    const [, topScouts = []] = await safeAwaitSSRData(getTopScouts({ limit: 200 }));
    return <TopScoutsTable scouts={topScouts} />;
  }

  if (tab === 'new-scouts') {
    const [, newScouts = []] = await safeAwaitSSRData(getRankedNewScoutsForCurrentWeek());
    return <NewScoutsTable scouts={newScouts} />;
  }

  if (tab === 'top-builders') {
    const [, topBuilders = []] = await safeAwaitSSRData(getTopBuilders({ limit: 200 }));
    return <TopBuildersTable builders={topBuilders} />;
  }

  if (tab === 'leaderboard') {
    const [, leaderboard = []] = await safeAwaitSSRData(getLeaderboard({ limit: 200 }));
    return <LeaderboardTable data={leaderboard} />;
  }
  return null;
}
