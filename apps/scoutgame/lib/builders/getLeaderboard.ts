import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';

export type LeaderBoardRow = {
  builderId: string;
  avatar: string | null;
  username: string;
  progress: number;
  gems: number;
  price: number;
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
          builderNfts: {
            select: {
              currentPrice: true,
              season: true
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
    const price = nft?.currentPrice ? Number(nft.currentPrice) : 0;
    return {
      builderId: weeklyTopBuilder.user.id,
      avatar: weeklyTopBuilder.user.avatar,
      username: weeklyTopBuilder.user.username,
      gems: weeklyTopBuilder.gemsCollected,
      progress,
      price
    };
  });
}
