import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';

export type TopBuilder = {
  id: string;
  username: string;
  avatar: string | null;
  seasonPoints: number;
  allTimePoints: number;
  scoutedBy: number;
  price: number;
};

export async function getTopBuilders({ limit }: { limit: number }): Promise<TopBuilder[]> {
  const topBuilders = await prisma.userSeasonStats.findMany({
    where: {
      season: currentSeason
    },
    orderBy: {
      pointsEarnedAsBuilder: 'desc'
    },
    take: limit,
    select: {
      pointsEarnedAsBuilder: true,
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          userAllTimeStats: {
            select: {
              pointsEarnedAsBuilder: true
            }
          },
          nftSoldEvents: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  return topBuilders.map((builder) => {
    const { user, pointsEarnedAsBuilder } = builder;
    const { id, username, avatar } = user;
    return {
      id,
      username,
      avatar,
      seasonPoints: pointsEarnedAsBuilder,
      allTimePoints: builder.user.userAllTimeStats[0].pointsEarnedAsBuilder,
      scoutedBy: builder.user.nftSoldEvents.length,
      price: 100
    };
  });
}
