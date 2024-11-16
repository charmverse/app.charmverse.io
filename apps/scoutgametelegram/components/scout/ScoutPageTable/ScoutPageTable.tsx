import 'server-only';

import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import type { TopBuildersSortBy } from 'lib/builders/getTopBuilders';
import { getTopBuilders } from 'lib/builders/getTopBuilders';
import { getTopScouts } from 'lib/scouts/getTopScouts';
import type { TopScoutsSortBy } from 'lib/scouts/getTopScouts';

import { TopBuildersTable } from './components/TopBuildersTable';
import { TopScoutsTable } from './components/TopScoutsTable';

export async function ScoutPageTable({ tab, order, sort }: { tab: string; order: string; sort: string }) {
  if (tab === 'builders') {
    const [, topBuilders = []] = await safeAwaitSSRData(
      getTopBuilders({ limit: 200, sortBy: sort as TopBuildersSortBy, order: order as 'asc' | 'desc' })
    );
    return <TopBuildersTable builders={topBuilders} order={order} sort={sort} />;
  } else if (tab === 'scouts') {
    const [, topScouts = []] = await safeAwaitSSRData(
      getTopScouts({ limit: 200, sortBy: sort as TopScoutsSortBy, order: order as 'asc' | 'desc' })
    );
    return <TopScoutsTable scouts={topScouts} order={order} sort={sort} />;
  }

  return null;
}
