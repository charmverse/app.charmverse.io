import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/scoutgame/utils';

export async function getLeaderboard() {
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

  const maxGemsCollected = weeklyTopBuilders[0].gemsCollected;

  return weeklyTopBuilders.map((weeklyTopBuilder) => {
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
