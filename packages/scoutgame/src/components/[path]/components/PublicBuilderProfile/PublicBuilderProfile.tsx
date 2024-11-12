import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

import { getBuilderActivities } from '../../../../builders/getBuilderActivities';
import { getBuilderScouts } from '../../../../builders/getBuilderScouts';
import { getBuilderStats } from '../../../../builders/getBuilderStats';

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
    prisma.builderNft.findUnique({
      where: {
        builderId_season: {
          builderId,
          season: currentSeason
        }
      },
      select: {
        imageUrl: true,
        currentPrice: true
      }
    }),
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
