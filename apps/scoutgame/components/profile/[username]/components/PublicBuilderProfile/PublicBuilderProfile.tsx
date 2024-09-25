import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';
import { notFound } from 'next/navigation';

import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getBuilderScouts } from 'lib/builders/getBuilderScouts';
import { getBuilderStats } from 'lib/builders/getBuilderStats';
import { getBuilderWeeklyStats } from 'lib/builders/getBuilderWeeklyStats';
import { BasicUserInfoSelect } from 'lib/users/queries';

import { PublicBuilderProfileContainer } from './PublicBuilderProfileContainer';

export async function PublicBuilderProfile({
  builderId,
  tab,
  user
}: {
  builderId: string;
  tab: string;
  user?: { username: string } | null;
}) {
  const builder = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      ...BasicUserInfoSelect,
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          currentPrice: true
        }
      }
    }
  });

  const isBuilder = builder.builder;

  const builderWeeklyStats = isBuilder
    ? await getBuilderWeeklyStats(builderId)
    : {
        gemsCollected: 0,
        rank: 0
      };

  const { allTimePoints, seasonPoints } = isBuilder
    ? await getBuilderStats(builderId)
    : {
        allTimePoints: 0,
        seasonPoints: 0
      };
  const builderActivities = isBuilder ? await getBuilderActivities({ builderId, take: 5 }) : [];
  const { scouts, totalNftsSold, totalScouts } = isBuilder
    ? await getBuilderScouts(builderId)
    : {
        scouts: [],
        totalNftsSold: 0,
        totalScouts: 0
      };

  if (!builder) {
    notFound();
  }

  return (
    <PublicBuilderProfileContainer
      tab={tab}
      user={user}
      scouts={scouts}
      builder={{
        ...builder,
        price: builder.builderNfts[0]?.currentPrice,
        githubLogin: builder.githubUser[0]?.login || ''
      }}
      allTimePoints={allTimePoints}
      seasonPoints={seasonPoints}
      totalScouts={totalScouts}
      totalNftsSold={totalNftsSold}
      builderActivities={builderActivities}
      gemsCollected={builderWeeklyStats.gemsCollected}
      rank={builderWeeklyStats.rank}
    />
  );
}
