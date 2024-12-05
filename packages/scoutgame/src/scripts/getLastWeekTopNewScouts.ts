import { NFTPurchaseEvent, prisma, UserWeeklyStats } from '@charmverse/core/prisma-client';
import { currentSeason, getLastWeek, getStartOfWeek } from '../dates';
import { prettyPrint } from '@packages/utils/strings';

export async function getLastWeekTopNewScouts() {
  const lastWeek = getLastWeek();
  const startOfLastWeek = getStartOfWeek(lastWeek);

  const startOfLastWeekAsJsDate = startOfLastWeek.toJSDate();
  const endOfLastWeekAsJsDate = startOfLastWeek.plus({ days: 7 }).toJSDate();

  const nftsSold = await prisma.nFTPurchaseEvent.findMany({
    where: {
      createdAt: {
        gte: startOfLastWeekAsJsDate,
        lte: endOfLastWeekAsJsDate
      }
    },
    select: {
      scoutId: true,
      builderNft: {
        select: {
          builderId: true
        }
      }
    }
  });

  const scoutIds = nftsSold.map((nft) => nft.scoutId);
  const scoutBuilderIdsRecord = nftsSold.reduce<Record<string, string[]>>((acc, nft) => {
    acc[nft.scoutId] = [...(acc[nft.scoutId] || []), nft.builderNft.builderId];
    return acc;
  }, {});

  const [weeklyStats, newScouts] = await prisma.$transaction([
    prisma.userWeeklyStats.findMany({
      where: {
        week: lastWeek,
        season: currentSeason,
        userId: {
          in: Array.from(new Set(Object.values(scoutBuilderIdsRecord).flat()))
        }
      }
    }),
    prisma.scout.findMany({
      where: {
        id: {
          in: scoutIds
        },
        nftPurchaseEvents: {
          every: {
            createdAt: {
              gte: startOfLastWeekAsJsDate,
              lte: endOfLastWeekAsJsDate
            }
          }
        }
      },
      take: 10,
      select: {
        id: true,
        path: true,
        displayName: true,
        avatar: true,
        nftPurchaseEvents: {
          select: {
            id: true
          }
        }
      }
    })
  ]);

  const nftPurchaseEventIdsByScoutId = newScouts.reduce<Record<string, string[]>>((acc, scout) => {
    acc[scout.id] = scout.nftPurchaseEvents.map((nft) => nft.id);
    return acc;
  }, {});

  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      event: {
        type: 'gems_payout'
      },
      recipientId: {
        in: newScouts.map((scout) => scout.id)
      }
    },
    select: {
      value: true,
      recipientId: true
    }
  });

  const pointsByUserId = pointsReceipts.reduce<Record<string, number>>((acc, receipt) => {
    if (receipt.recipientId) {
      acc[receipt.recipientId] = (acc[receipt.recipientId] || 0) + receipt.value;
    }
    return acc;
  }, {});

  const weeklyStatsByUserId = weeklyStats.reduce<Record<string, UserWeeklyStats>>((acc, stat) => {
    acc[stat.userId] = stat;
    return acc;
  }, {});
  const scouts = newScouts
    .map((scout) => {
      const buildersScouted = Array.from(new Set(scoutBuilderIdsRecord[scout.id] || []));
      const builderGemsCollected = buildersScouted
        .map((builderId) => weeklyStatsByUserId[builderId]?.gemsCollected || 0)
        .reduce((acc, curr) => acc + curr, 0);
      const pointsEarned = pointsByUserId[scout.id] || 0;
      return {
        id: scout.id,
        path: scout.path,
        displayName: scout.displayName,
        builderGemsCollected,
        pointsEarned
      };
    })
    .sort((a, b) => {
      return b.builderGemsCollected - a.builderGemsCollected;
    });

  return scouts;
}

getLastWeekTopNewScouts().then(prettyPrint);
