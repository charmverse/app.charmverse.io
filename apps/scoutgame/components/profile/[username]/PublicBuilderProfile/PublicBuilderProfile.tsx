import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';
import { notFound } from 'next/navigation';

import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getBuilderScouts } from 'lib/builders/getBuilderScouts';
import { getBuilderStats } from 'lib/builders/getBuilderStats';
import { getBuilderWeeklyStats } from 'lib/builders/getBuilderWeeklyStats';

import { PublicBuilderProfileContainer } from './PublicBuilderProfileContainer';

export async function PublicBuilderProfile({ builderId, tab }: { builderId: string; tab: string }) {
  const builderWeeklyStats = await getBuilderWeeklyStats(builderId);
  const { allTimePoints, seasonPoints } = await getBuilderStats(builderId);
  const builderActivities = await getBuilderActivities({ builderId, take: 5 });
  const { scouts, totalNftsSold, totalScouts } = await getBuilderScouts(builderId);
  const builder = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      avatar: true,
      username: true,
      displayName: true,
      bio: true,
      githubUser: {
        select: {
          login: true
        }
      },
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

  if (!builder) {
    notFound();
  }

  return (
    <PublicBuilderProfileContainer
      tab={tab}
      scouts={scouts}
      builder={{
        avatar: builder.avatar || '',
        username: builder.username,
        displayName: builder.displayName,
        price: Number(builder.builderNfts[0].currentPrice),
        githubLogin: builder.githubUser[0]?.login || '',
        bio: builder.bio || ''
      }}
      builderId={builderId}
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
