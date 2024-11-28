import 'server-only';

import type { BuildersSortBy } from '@packages/scoutgame/builders/getBuilders';
import { getBuilders } from '@packages/scoutgame/builders/getBuilders';
import { getRankedNewScoutsForCurrentWeek } from '@packages/scoutgame/scouts/getNewScouts';
import { getScouts, type ScoutsSortBy } from '@packages/scoutgame/scouts/getScouts';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { BuildersTable } from './components/BuildersTable';
import { NewScoutsTable } from './components/NewScoutsTable';
import { ScoutsTable } from './components/ScoutsTable';

export async function ScoutPageTable({ tab, order, sort }: { tab: string; order: string; sort: string }) {
  if (tab === 'builders') {
    const [, builders = []] = await safeAwaitSSRData(
      getBuilders({ limit: 200, sortBy: sort as BuildersSortBy, order: order as 'asc' | 'desc' })
    );
    return <BuildersTable builders={builders} order={order} sort={sort} />;
  } else if (tab === 'scouts') {
    const [, scouts = []] = await safeAwaitSSRData(
      getScouts({ limit: 200, sortBy: sort as ScoutsSortBy, order: order as 'asc' | 'desc' })
    );
    return <ScoutsTable scouts={scouts} order={order} sort={sort} />;
  } else if (tab === 'new-scouts') {
    const [, newScouts = []] = await safeAwaitSSRData(getRankedNewScoutsForCurrentWeek());
    return <NewScoutsTable scouts={newScouts} />;
  }

  return null;
}
