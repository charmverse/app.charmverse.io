import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';

export type LeaderBoardRow = {
  id: string;
  avatar: string | null;
  username: string;
  displayName: string;
  progress: number;
  gemsCollected: number;
  price: bigint;
  nftImageUrl?: string;
};

export async function getLeaderboard(): Promise<LeaderBoardRow[]> {
  const currentWeek = getCurrentWeek();
  const season = currentSeason;
  const weeklyTopBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      week: currentWeek
    },
    orderBy: {
      rank: 'asc'
    },
    take: 10,
    select: {
      gemsCollected: true,
      user: {
        select: {
          id: true,
          avatar: true,
          username: true,
          displayName: true,
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

  return weeklyTopBuilders.map((weeklyTopBuilder) => {
    const maxGemsCollected = weeklyTopBuilders[0].gemsCollected;
    const progress = (weeklyTopBuilder.gemsCollected / maxGemsCollected) * 100;
    const nft = weeklyTopBuilder.user.builderNfts.find((n) => n.season === season);
    const price = nft?.currentPrice ?? BigInt(0);
    return {
      id: weeklyTopBuilder.user.id,
      avatar: weeklyTopBuilder.user.avatar,
      username: weeklyTopBuilder.user.username,
      displayName: weeklyTopBuilder.user.displayName,
      gemsCollected: weeklyTopBuilder.gemsCollected,
      progress,
      price,
      nftImageUrl: nft?.imageUrl
    };
  });
}
