import 'server-only';

import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getLeaderboard } from 'lib/builders/getLeaderboard';
import { getTopBuilders } from 'lib/builders/getTopBuilders';
import { getTopScouts } from 'lib/scouts/getTopScouts';

import { ActivityTable } from './ActivityTable';
import { LeaderboardTable } from './LeaderboardTable';
import { TopBuildersTable } from './TopBuildersTable';
import { TopScoutsTable } from './TopScoutsTable';

export async function HomeTab({ tab }: { tab: string }) {
  if (tab === 'activity') {
    const activities = await getBuilderActivities({ take: 10 });
    return <ActivityTable activities={activities} />;
  }

  if (tab === 'top-scouts') {
    const topScouts = await getTopScouts({ limit: 10 });
    return <TopScoutsTable scouts={topScouts} />;
  }

  if (tab === 'top-builders') {
    const topBuilders = await getTopBuilders({ limit: 10 });
    return <TopBuildersTable builders={topBuilders} />;
  }

  if (tab === 'leaderboard') {
    const data = await getLeaderboard();
    return <LeaderboardTable data={data} />;
  }
  return null;
}
