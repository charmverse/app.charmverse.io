import { prisma } from '@charmverse/core/prisma-client';

export type TopScout = {
  id: string;
  username: string;
  avatar: string | null;
  buildersScouted: number;
  nftsHeld: number;
  allTimePoints: number;
  seasonPoints: number;
};

export async function getTopScouts({ limit }: { limit: number }): Promise<TopScout[]> {
  const topScouts = await prisma.userSeasonStats.findMany({
    orderBy: {
      pointsEarnedAsScout: 'desc'
    },
    take: limit,
    select: {
      pointsEarnedAsScout: true,
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          nftPurchaseEvents: {
            select: {
              builderId: true
            }
          },
          userAllTimeStats: {
            select: {
              pointsEarnedAsScout: true
            }
          }
        }
      }
    }
  });

  return topScouts.map((scout) => {
    const buildersScouted = Array.from(new Set(scout.user.nftPurchaseEvents.map((event) => event.builderId))).length;
    const nftsHeld = scout.user.nftPurchaseEvents.length;
    const allTimePoints = scout.user.userAllTimeStats[0]?.pointsEarnedAsScout || 0;
    const seasonPoints = scout.pointsEarnedAsScout;

    return {
      id: scout.user.id,
      username: scout.user.username,
      avatar: scout.user.avatar,
      buildersScouted,
      nftsHeld,
      allTimePoints,
      seasonPoints
    };
  });
}
