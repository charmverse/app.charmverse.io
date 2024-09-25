import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { BuilderUserInfo } from './interfaces';

// TODO - Uses nft sale events, but doesn't account for cases where the multiple nfts were purchased at once
export async function getBuilders(
  {
    limit = 10,
    orderBy,
    where
  }: { limit?: number; orderBy?: Prisma.BuilderNftFindManyArgs['orderBy']; where?: Prisma.BuilderNftWhereInput } = {
    limit: 10
  }
): Promise<BuilderUserInfo[]> {
  const topNfts = await prisma.builderNft.findMany({
    where,
    take: limit,
    orderBy,
    select: {
      id: true,
      currentPrice: true,
      builder: {
        select: {
          id: true,
          avatar: true,
          username: true,
          gemsPayoutEvents: {
            select: {
              gems: true
            }
          },
          pointsReceived: {
            select: {
              value: true
            }
          }
        }
      },
      nftSoldEvents: {
        select: {
          scoutId: true,
          tokensPurchased: true
        }
      }
    }
  });

  return topNfts.map((topNft) => {
    const nftMetrics = topNft.nftSoldEvents.reduce(
      (acc, event) => {
        acc.scouts[event.scoutId] = (acc.scouts[event.scoutId] || 0) + event.tokensPurchased;
        acc.totalSold += event.tokensPurchased;
        return acc;
      },
      { scouts: {}, totalSold: 0 } as { scouts: Record<string, number>; totalSold: number }
    );

    const builderWithInfo: BuilderUserInfo = {
      id: topNft.builder.id,
      avatar: topNft.builder.avatar,
      username: topNft.builder.username,
      gems: 0,
      nftsSold: nftMetrics.totalSold,
      price: Number(topNft.currentPrice),
      scoutedBy: Object.keys(nftMetrics.scouts).length
    };

    return builderWithInfo;
  });
}
