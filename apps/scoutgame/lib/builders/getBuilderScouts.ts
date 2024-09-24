import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';
import { isTruthy } from '@root/lib/utils/types';

import type { ScoutInfo } from 'components/scout/ScoutCard';

export async function getBuilderScouts(builderId: string) {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderEvent: {
        builderId,
        season: currentSeason
      }
    },
    select: {
      scout: {
        select: {
          username: true,
          avatar: true,
          displayName: true,
          id: true
        }
      },
      tokensPurchased: true
    }
  });

  const uniqueScoutIds = Array.from(new Set(nftPurchaseEvents.map((event) => event.scout.id).filter(isTruthy)));
  const scoutsRecord: Record<string, ScoutInfo> = {};

  nftPurchaseEvents.forEach((event) => {
    const existingScout = scoutsRecord[event.scout.id];
    if (!existingScout) {
      scoutsRecord[event.scout.id] = {
        username: event.scout.username,
        avatar: event.scout.avatar || '',
        displayName: event.scout.displayName,
        nfts: 0
      };
    }
    scoutsRecord[event.scout.id].nfts += event.tokensPurchased;
  });

  const totalNftsSold = Object.values(scoutsRecord).reduce((acc, scout) => acc + scout.nfts, 0);

  return {
    totalScouts: uniqueScoutIds.length,
    totalNftsSold,
    scouts: Object.values(scoutsRecord)
  };
}
