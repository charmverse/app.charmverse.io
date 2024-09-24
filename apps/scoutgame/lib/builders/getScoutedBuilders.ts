import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/utils';
import { isTruthy } from '@root/lib/utils/types';

import type { BuilderInfo } from 'components/builder/Card/BuilderCard';

export async function getScoutedBuilders({ scoutId }: { scoutId: string }): Promise<BuilderInfo[]> {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNFT: {
        season: currentSeason
      },
      scoutId
    },
    select: {
      builderEvent: {
        select: {
          builderId: true
        }
      }
    }
  });

  const builderNftsHeldRecord: Record<string, number> = {};
  nftPurchaseEvents.forEach((event) => {
    const builderId = event.builderEvent?.builderId;
    if (builderId) {
      builderNftsHeldRecord[builderId] = (builderNftsHeldRecord[builderId] || 0) + 1;
    }
  });

  const uniqueBuilderIds = Array.from(
    new Set(nftPurchaseEvents.map((event) => event.builderEvent?.builderId).filter(isTruthy))
  );

  const builders = await prisma.scout.findMany({
    where: {
      id: {
        in: uniqueBuilderIds
      }
    },
    select: {
      id: true,
      avatar: true,
      username: true,
      displayName: true,
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      bannedAt: true,
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
      nftAvatar: builder.avatar || '',
      username: builder.username,
      displayName: builder.displayName,
      builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder ?? 0,
      gems: builder.userWeeklyStats[0]?.gemsCollected ?? 0,
      isBanned: !!builder.bannedAt,
      nfts: builderNftsHeldRecord[builder.id] ?? 0
    };
  });
}
