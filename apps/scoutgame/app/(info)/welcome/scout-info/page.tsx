import { log } from '@charmverse/core/log';
import { BuilderNftType } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { getBuildersByFid } from '@packages/scoutgame/social/getBuildersByFid';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ScoutInfoPage } from 'components/welcome/scout-info/ScoutInfoPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function ScoutInfo() {
  const starterPackBuilder = await getBuildersByFid({
    // piesrtasty
    fids: [547807],
    season: currentSeason,
    nftType: BuilderNftType.starter_pack,
    limit: 1
  });

  if (!starterPackBuilder.builders[0]) {
    log.warn('No starter pack builder found, redirecting to builders you know');
    redirect('/builders-you-know');
  }

  return <ScoutInfoPage builder={starterPackBuilder.builders[0]} />;
}
