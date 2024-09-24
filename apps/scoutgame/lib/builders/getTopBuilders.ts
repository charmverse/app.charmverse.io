import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from 'lib/builderNFTs/constants';

export type TopBuilder = {
  id: string;
  avatar: string;
  username: string;
  price: number;
  likes: number;
  scouts: number;
  gems: number;
  nftsBought: number;
};

export async function getTopBuilders(): Promise<TopBuilder[]> {
  const topNfts = await prisma.builderNft.findMany({
    where: {
      season: currentSeason,
      builder: {
        bannedAt: null
      }
    },
    orderBy: {
      nftSoldEvents: {
        _count: 'desc'
      }
    },
    take: 10,
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
          tokensPurchased: true
        }
      }
    }
  });

  return topNfts.map(
    (topNft) =>
      ({
        id: topNft.builder.id,
        avatar: topNft.builder.avatar,
        username: topNft.builder.username,
        price: Number(topNft.currentPrice),
        likes: 200,
        scouts: topNft.nftSoldEvents.reduce((acc, event) => acc + event.tokensPurchased, 0),
        gems: topNft.builder.gemsPayoutEvents.reduce((acc, event) => acc + event.gems, 0),
        nftsBought: 0
      } as TopBuilder)
  );
}
