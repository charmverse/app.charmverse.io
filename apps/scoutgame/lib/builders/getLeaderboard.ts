import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason, validateISOWeek } from '@packages/scoutgame/dates';

export type LeaderBoardRow = {
  id: string;
  avatar: string | null;
  displayName: string;
  path: string;
  builderStatus: BuilderStatus;
  progress: number;
  gemsCollected: number;
  price: bigint;
  nftImageUrl?: string;
};

export async function getLeaderboard({
  limit = 10,
  week = getCurrentWeek(),
  season = currentSeason
}: {
  limit?: number;
  week?: string;
  season?: string;
}): Promise<LeaderBoardRow[]> {
  const isWeekValid = validateISOWeek(week);

  const weeklyTopBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      week: isWeekValid ? week : getCurrentWeek(),
      season,
      rank: {
        not: null
      },
      user: {
        builderStatus: 'approved'
      }
    },
    orderBy: {
      rank: 'asc'
    },
    take: limit,
    select: {
      gemsCollected: true,
      user: {
        select: {
          id: true,
          avatar: true,
          path: true,
          displayName: true,
          builderStatus: true,
          builderNfts: {
            select: {
              currentPrice: true,
              season: true,
              imageUrl: true
            }
          }
        }
      }
    }
  });

  return weeklyTopBuilders
    .map((weeklyTopBuilder) => {
      const maxGemsCollected = weeklyTopBuilders[0].gemsCollected;
      const progress = (weeklyTopBuilder.gemsCollected / maxGemsCollected) * 100;
      const nft = weeklyTopBuilder.user.builderNfts.find((n) => n.season === season);
      const price = nft?.currentPrice ?? BigInt(0);
      return {
        id: weeklyTopBuilder.user.id,
        avatar: weeklyTopBuilder.user.avatar,
        displayName: weeklyTopBuilder.user.displayName,
        path: weeklyTopBuilder.user.path,
        builderStatus: weeklyTopBuilder.user.builderStatus!,
        gemsCollected: weeklyTopBuilder.gemsCollected,
        progress,
        price,
        nftImageUrl: nft?.imageUrl
      };
    })
    .filter((builder) => builder.gemsCollected > 0);
}
