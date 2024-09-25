import { prisma } from '@charmverse/core/prisma-client';

export async function getTopBuilders({ quantity, week }: { quantity?: number; week: string }) {
  const userWeeklyStats = await prisma.userWeeklyStats.findMany({
    where: {
      week
    },
    orderBy: {
      gemsCollected: 'desc'
    },
    select: {
      user: {
        select: {
          id: true,
          username: true,
          events: {
            where: {
              type: 'merged_pull_request'
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            select: {
              createdAt: true
            }
          }
        }
      },
      gemsCollected: true
    }
  });

  // Sort based on gems collected first
  // If the gems are equal then order based on the earliest builder event created at date
  const topBuilders = userWeeklyStats
    .sort((a, b) => {
      if (a.gemsCollected === b.gemsCollected) {
        const userAEvent = a.user.events[0]?.createdAt.getTime() ?? 0;
        const userBEvent = b.user.events[0]?.createdAt.getTime() ?? 0;
        if (userBEvent === userAEvent) {
          return a.user.username.localeCompare(b.user.username);
        }

        return userBEvent - userAEvent;
      }
      return b.gemsCollected - a.gemsCollected;
    })
    .map((userWeeklyStat, index) => ({
      builder: {
        id: userWeeklyStat.user.id,
        username: userWeeklyStat.user.username
      },
      gemsCollected: userWeeklyStat.gemsCollected,
      rank: index + 1
    }));

  if (quantity) {
    return topBuilders.slice(0, quantity);
  }

  return topBuilders;
}
