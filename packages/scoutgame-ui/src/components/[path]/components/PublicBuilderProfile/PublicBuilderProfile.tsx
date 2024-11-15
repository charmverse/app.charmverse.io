import 'server-only';

import { getBuilderActivities } from '@packages/scoutgame/builders/getBuilderActivities';
import { getBuilderNft } from '@packages/scoutgame/builders/getBuilderNft';
import { getBuilderScouts } from '@packages/scoutgame/builders/getBuilderScouts';
import { getBuilderStats } from '@packages/scoutgame/builders/getBuilderStats';

import type { BuilderProfileProps } from './PublicBuilderProfileContainer';
import { PublicBuilderProfileContainer } from './PublicBuilderProfileContainer';

export async function PublicBuilderProfile({ builder }: { builder: BuilderProfileProps['builder'] }) {
  const builderId = builder.id;

  const [
    builderNft,
    { allTimePoints = 0, seasonPoints = 0, rank = 0, gemsCollected = 0 } = {},
    builderActivities = [],
    { scouts = [], totalNftsSold = 0, totalScouts = 0 } = {}
  ] = await Promise.all([
    getBuilderNft(builderId),
    getBuilderStats(builderId),
    getBuilderActivities({ builderId, limit: 200 }),
    getBuilderScouts(builderId)
  ]);

  return (
    <PublicBuilderProfileContainer
      scouts={scouts}
      builder={{
        ...builder,
        nftImageUrl: builderNft?.imageUrl,
        price: builderNft?.currentPrice ?? BigInt(0)
      }}
      allTimePoints={allTimePoints}
      seasonPoints={seasonPoints}
      totalScouts={totalScouts}
      totalNftsSold={totalNftsSold}
      builderActivities={builderActivities}
      gemsCollected={gemsCollected}
      rank={rank}
    />
  );
}
