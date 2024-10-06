'use server';

import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getLeaderboard } from 'lib/builders/getLeaderboard';
import { getTopBuilders } from 'lib/builders/getTopBuilders';
import { getTopScouts } from 'lib/scouts/getTopScouts';

import { ActivityTable } from './components/ActivityTable';
import { LeaderboardTable } from './components/LeaderboardTable';
import { TopBuildersTable } from './components/TopBuildersTable';
import { TopScoutsTable } from './components/TopScoutsTable';

export async function HomeTab({ tab, userId }: { tab: string; userId?: string }) {
  if (tab === 'activity') {
    const activities = await getBuilderActivities({ limit: 200 });
    return <ActivityTable activities={activities} />;
  }

  if (tab === 'top-scouts') {
    const topScouts = await getTopScouts({ limit: 200 });
    return <TopScoutsTable scouts={topScouts} />;
  }

  if (tab === 'top-builders') {
    const topBuilders = await getTopBuilders({ limit: 200 });
    return <TopBuildersTable builders={topBuilders} userId={userId} />;
  }

  if (tab === 'leaderboard') {
    const data = await getLeaderboard({ limit: 200 });
    return <LeaderboardTable data={data} userId={userId} />;
  }
  return null;
}
