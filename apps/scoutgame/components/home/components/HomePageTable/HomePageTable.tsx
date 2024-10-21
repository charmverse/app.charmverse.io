import 'server-only';

import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getLeaderboard } from 'lib/builders/getLeaderboard';
import { getTopBuilders } from 'lib/builders/getTopBuilders';
import { getTopScouts } from 'lib/scouts/getTopScouts';
import { safeAwaitSSRData } from 'lib/utils/async';

import { ActivityTable } from './components/ActivityTable';
import { LeaderboardTable } from './components/LeaderboardTable';
import { TopBuildersTable } from './components/TopBuildersTable';
import { TopScoutsTable } from './components/TopScoutsTable';

export async function HomeTab({ tab, userId }: { tab: string; userId?: string }) {
  if (tab === 'activity') {
    const [, activities = []] = await safeAwaitSSRData(getBuilderActivities({ limit: 100 }));
    return <ActivityTable activities={activities} />;
  }

  if (tab === 'top-scouts') {
    const [, topScouts = []] = await safeAwaitSSRData(getTopScouts({ limit: 200 }));
    return <TopScoutsTable scouts={topScouts} />;
  }

  if (tab === 'top-builders') {
    const [, topBuilders = []] = await safeAwaitSSRData(getTopBuilders({ limit: 200 }));
    return <TopBuildersTable builders={topBuilders} userId={userId} />;
  }

  if (tab === 'leaderboard') {
    const [, leaderboard = []] = await safeAwaitSSRData(getLeaderboard({ limit: 200 }));
    return <LeaderboardTable data={leaderboard} userId={userId} />;
  }
  return null;
}
