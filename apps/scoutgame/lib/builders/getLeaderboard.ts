import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';

export type LeaderBoardRow = {
  id: string;
  avatar: string | null;
  username: string | null;
  path: string | null;
  builderStatus: BuilderStatus;
  progress: number;
  gemsCollected: number;
  price: bigint;
  nftImageUrl?: string;
};

export async function getLeaderboard({ limit = 10 }: { limit: number }): Promise<LeaderBoardRow[]> {
  const currentWeek = getCurrentWeek();
  const season = currentSeason;
  const weeklyTopBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      week: currentWeek,
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
          username: true,
          path: true,
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
        username: weeklyTopBuilder.user.username,
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
