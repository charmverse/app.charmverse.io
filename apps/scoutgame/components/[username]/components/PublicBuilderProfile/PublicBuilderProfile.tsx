import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getBuilderScouts } from 'lib/builders/getBuilderScouts';
import { getBuilderStats } from 'lib/builders/getBuilderStats';
import type { BasicUserInfo } from 'lib/users/interfaces';

import { PublicBuilderProfileContainer } from './PublicBuilderProfileContainer';

export async function PublicBuilderProfile({ tab, user }: { tab: string; user: BasicUserInfo }) {
  const builderId = user.id;
  const isBuilder = user.builderStatus === 'approved';

  const [
    builderNft,
    { allTimePoints = 0, seasonPoints = 0, rank = 0, gemsCollected = 0 } = {},
    builderActivities = [],
    { scouts = [], totalNftsSold = 0, totalScouts = 0 } = {}
  ] = isBuilder
    ? await Promise.all([
        prisma.builderNft.findUniqueOrThrow({
          where: {
            builderId_season: {
              builderId: user.id,
              season: currentSeason
            }
          },
          select: {
            currentPrice: true
          }
        }),
        getBuilderStats(builderId),
        getBuilderActivities({ builderId, take: 5 }),
        getBuilderScouts(builderId)
      ])
    : [];

  return (
    <PublicBuilderProfileContainer
      tab={tab}
      user={user}
      scouts={scouts}
      builder={{
        ...user,
        price: builderNft?.currentPrice
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
