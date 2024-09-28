import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import { BasicUserInfoSelect } from 'lib/users/queries';

import type { BuilderInfo } from '../builders/interfaces';

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

  const builderNftsPurchasedRecord: Record<string, number> = {};
  nftPurchaseEvents.forEach((event) => {
    const builderId = event.builderNFT.builderId;
    if (builderId) {
      builderNftsPurchasedRecord[builderId] = (builderNftsPurchasedRecord[builderId] || 0) + event.tokensPurchased;
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
          pointsEarnedAsBuilder: true
        }
      },
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          imageUrl: true
        }
      },
      builderStatus: true,
      userWeeklyStats: {
        where: {
          week: getCurrentWeek()
        },
        select: {
          gemsCollected: true
        }
      }
    }
  });

  return builders.map((builder) => {
    return {
      id: builder.id,
      nftImageUrl: builder.builderNfts[0]?.imageUrl,
      username: builder.username,
      displayName: builder.displayName,
      builderStatus: builder.builderStatus,
      builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder ?? 0,
      gems: builder.userWeeklyStats[0]?.gemsCollected ?? 0,
      isBanned: builder.builderStatus === 'banned',
      nftsSold: builderNftsPurchasedRecord[builder.id] ?? 0
    };
  });
}
