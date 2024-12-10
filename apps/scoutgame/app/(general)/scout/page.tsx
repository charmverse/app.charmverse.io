import { prisma } from '@charmverse/core/prisma-client';
import { MAX_STARTER_PACK_PURCHASES } from '@packages/scoutgame/builderNfts/constants';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';
import { getStarterPackBuilders } from '@packages/scoutgame/builders/getStarterPackBuilders';
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

  let builders: StarterPackBuilder[] = [];

  let remainingStarterCards = MAX_STARTER_PACK_PURCHASES;

  if (user?.id) {
    const purchases = await prisma.nFTPurchaseEvent
      .aggregate({
        where: { builderNft: { nftType: 'starter_pack', season: currentSeason }, scoutId: user.id },
        _sum: { tokensPurchased: true }
      })
      .then((res) => res._sum.tokensPurchased || 0);

    remainingStarterCards = MAX_STARTER_PACK_PURCHASES - purchases;

    if (purchases < MAX_STARTER_PACK_PURCHASES) {
      const [_, starterPackBuilders] = await safeAwaitSSRData(getStarterPackBuilders({ userId: user?.id }));
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
      remainingStarterCards={remainingStarterCards}
    />
  );
}
