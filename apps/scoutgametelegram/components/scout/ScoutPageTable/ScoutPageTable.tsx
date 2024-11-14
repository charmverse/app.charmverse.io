import 'server-only';

import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { getTopBuilders } from 'lib/builders/getTopBuilders';

import { TopBuildersTable } from './components/TopBuildersTable';

export async function ScoutPageTable({ tab }: { tab: string }) {
  if (tab === 'builders') {
    const [, topBuilders = []] = await safeAwaitSSRData(getTopBuilders({ limit: 200, sortBy: 'rank', order: 'asc' }));
    return <TopBuildersTable builders={topBuilders} />;
  }

  return null;
}
