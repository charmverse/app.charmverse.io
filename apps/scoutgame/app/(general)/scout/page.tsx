import { prisma } from '@charmverse/core/prisma-client';
import { getStarterpackBuilders } from '@packages/scoutgame/builders/getStarterPackBuilders';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { MAX_STARTER_PACK_PURCHASES } from '@packages/scoutgame/constants';
import { currentSeason } from '@packages/scoutgame/dates';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const scoutSort = (searchParams.scoutSort as string) || 'points';
  const builderSort = (searchParams.builderSort as string) || 'rank';
  const builderOrder = (searchParams.builderOrder as string) || 'asc';
  const scoutOrder = (searchParams.scoutOrder as string) || 'desc';
  const scoutTab = (searchParams.scoutTab as string) || 'scouts';
  const buildersLayout = (searchParams.buildersLayout as string) || 'table';
  const tab = (searchParams.tab as string) || 'scouts';

  const user = await getUserFromSession();

  let builders: BuilderInfo[] = [];

  if (user?.id) {
    const purchases = await prisma.nFTPurchaseEvent.count({
      where: { builderNFT: { nftType: 'season_1_starter_pack', season: currentSeason }, scoutId: user.id }
    });

    if (purchases < MAX_STARTER_PACK_PURCHASES) {
      const [_, starterPackBuilders] = await safeAwaitSSRData(getStarterpackBuilders({ season: currentSeason }));
      builders = starterPackBuilders ?? [];
    }
  }

  return (
    <ScoutPage
      scoutSort={scoutSort}
      builderSort={builderSort}
      scoutOrder={scoutOrder}
      builderOrder={builderOrder}
      scoutTab={scoutTab}
      buildersLayout={buildersLayout}
      tab={tab}
      starterpackBuilders={builders}
    />
  );
}
