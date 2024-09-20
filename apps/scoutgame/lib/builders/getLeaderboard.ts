import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/scoutgame/utils';

export type LeaderBoardRow = {
  avatar: string | null;
  username: string;
  progress: number;
  gems: number;
  price: number;
};

export async function getLeaderboard(): Promise<LeaderBoardRow[]> {
  const currentWeek = getCurrentWeek();
  const weeklyTopBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      week: currentWeek
    },
    orderBy: {
      gemsCollected: 'desc'
    },
    take: 10,
    select: {
      gemsCollected: true,
      user: {
        select: {
          avatar: true,
          username: true
        }
      }
    }
  });

  return weeklyTopBuilders.map((weeklyTopBuilder) => {
    const maxGemsCollected = weeklyTopBuilders[0].gemsCollected;
    const progress = (weeklyTopBuilder.gemsCollected / maxGemsCollected) * 100;
    const price = parseInt(progress.toString());
    return {
      avatar: weeklyTopBuilder.user.avatar,
      username: weeklyTopBuilder.user.username,
      gems: weeklyTopBuilder.gemsCollected,
      progress,
      price
    };
  });
}
