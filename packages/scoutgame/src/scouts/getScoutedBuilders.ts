import { prisma } from '@charmverse/core/prisma-client';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import type { Last7DaysGems } from '../builders/getTodaysHotBuilders';
import { BasicUserInfoSelect } from '../users/queries';

export async function getScoutedBuilders({ scoutId }: { scoutId: string }): Promise<BuilderInfo[]> {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNFT: {
        season: currentSeason
      },
      scoutId
    },
    select: {
      tokensPurchased: true,
      builderNFT: {
        select: {
          builderId: true
        }
      }
    }
  });

  const uniqueBuilderIds = Array.from(new Set(nftPurchaseEvents.map((event) => event.builderNFT.builderId)));

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
          imageUrl: true,
          currentPrice: true
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

  return builders.map((builder) => {
    const nftsSoldToScout = nftPurchaseEvents
      .filter((event) => event.builderNFT.builderId === builder.id)
      .reduce((acc, event) => acc + event.tokensPurchased, 0);
    return {
      id: builder.id,
      nftImageUrl: builder.builderNfts[0]?.imageUrl,
      path: builder.path,
      displayName: builder.displayName,
      builderStatus: builder.builderStatus!,
      builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder ?? 0,
      nftsSold: builder.userSeasonStats[0]?.nftsSold ?? 0,
      nftsSoldToScout,
      rank: builder.userWeeklyStats[0]?.rank ?? -1,
      price: builder.builderNfts[0]?.currentPrice ?? 0,
      last7DaysGems: ((builder.builderCardActivities[0]?.last7Days as unknown as Last7DaysGems) || [])
        .map((gem) => gem.gemsCount)
        .slice(-7)
    };
  });
}
