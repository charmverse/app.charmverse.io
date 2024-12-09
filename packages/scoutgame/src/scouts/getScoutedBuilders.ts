import { prisma } from '@charmverse/core/prisma-client';

import type { BuilderInfo } from '../builders/interfaces';
import { normalizeLast7DaysGems } from '../builders/utils/normalizeLast7DaysGems';
import { currentSeason, getCurrentWeek } from '../dates';
import { BasicUserInfoSelect } from '../users/queries';

export async function getScoutedBuilders({ scoutId }: { scoutId: string }): Promise<BuilderInfo[]> {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNft: {
        season: currentSeason
      },
      scoutId
    },
    select: {
      tokensPurchased: true,
      builderNft: {
        select: {
          builderId: true,
          nftType: true
        }
      }
    }
  });

  const uniqueBuilderIds = Array.from(new Set(nftPurchaseEvents.map((event) => event.builderNft.builderId)));

  const builders = await prisma.scout.findMany({
    where: {
      id: {
        in: uniqueBuilderIds
      }
    },
    select: {
      ...BasicUserInfoSelect,
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          nftsSold: true,
          pointsEarnedAsBuilder: true
        }
      },
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          contractAddress: true,
          imageUrl: true,
          currentPrice: true,
          nftType: true,
          nftSoldEvents: true,
          congratsImageUrl: true
        }
      },
      builderCardActivities: {
        select: {
          last7Days: true
        }
      },
      builderStatus: true,
      userWeeklyStats: {
        where: {
          week: getCurrentWeek()
        },
        select: {
          rank: true
        }
      }
    }
  });

  return builders.flatMap((builder) => {
    return builder.builderNfts
      .map((nft) => {
        const nftsSoldData = nft.nftSoldEvents.reduce(
          (acc, event) => {
            acc.total += event.tokensPurchased;
            if (event.scoutId === scoutId) {
              acc.toScout += event.tokensPurchased;
            }
            return acc;
          },
          { total: 0, toScout: 0 }
        );

        if (nftsSoldData.toScout === 0) {
          return null;
        }

        const nftData: BuilderInfo = {
          id: builder.id,
          nftImageUrl: nft.imageUrl,
          path: builder.path,
          displayName: builder.displayName,
          builderStatus: builder.builderStatus!,
          builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder ?? 0,
          nftsSold: nftsSoldData.total,
          nftsSoldToScout: nftsSoldData.toScout,
          rank: builder.userWeeklyStats[0]?.rank ?? -1,
          price: nft.currentPrice ?? 0,
          last7DaysGems: normalizeLast7DaysGems(builder.builderCardActivities[0]),
          nftType: nft.nftType,
          congratsImageUrl: nft.congratsImageUrl
        };

        return nftData;
      })
      .filter((nft) => nft !== null) as BuilderInfo[];
  });
}
