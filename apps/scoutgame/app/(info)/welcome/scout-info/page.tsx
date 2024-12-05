import { BuilderNftType } from '@charmverse/core/prisma-client';
import { getStarterpackBuilders } from '@packages/scoutgame/builders/getStarterPackBuilders';
import { currentSeason } from '@packages/scoutgame/dates';
import { getBuildersByFid } from '@packages/scoutgame/social/getBuildersByFid';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';
import type { Metadata } from 'next';

import { ScoutInfoPage } from 'components/welcome/scout-info/ScoutInfoPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function ScoutInfo() {
  const starterPackBuilders = await getStarterpackBuilders({ season: currentSeason, limit: 1 });

  const starterPackBuilder = await getBuildersByFid({
    // piesrtasty
    fids: [547807],
    season: currentSeason,
    nftType: BuilderNftType.season_1_starter_pack,
    limit: 1
  });

  if (!starterPackBuilder.builders[0]) {
    return null;
  }

  return <ScoutInfoPage builder={starterPackBuilder.builders[0]} />;
}
