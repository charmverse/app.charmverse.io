import {
  prisma,
  type BuilderEvent,
  type GemsReceipt,
  type NFTPurchaseEvent,
  type PointsReceipt
} from '@charmverse/core/prisma-client';

import { getCurrentWeek, getCurrentWeekPoints } from './utils';

const gemsToPoints = 1;
const decayRate = 0.03;

// calculate a builder's points based on gems
export function getBuilderPointsFromGems(
  builderId: string,
  receipts: (GemsReceipt & { event: Pick<BuilderEvent, 'builderId'> })[]
) {
  const gemsEarned = receipts.reduce<number>((acc, receipt) => {
    if (receipt.event.builderId === builderId) {
      return acc + receipt.value;
    }
    return acc;
  }, 0);
  return gemsEarned * gemsToPoints;
}

// return the % of points earned by a scout from an NFT
export function getNFTScoutSplit(contract: string, tokenId: number, nftEvents: NFTPurchaseEvent[]) {
  const nfts = nftEvents.filter((nft) => nft.contractAddress === contract);
  // TODO: apply actual equation
  return 100 / nfts.length;
}

// get the points for a user based on NFTs and gem receipts
export function getPointsFromGems(
  userId: string,
  nftEvents: NFTPurchaseEvent[],
  receipts: (GemsReceipt & { event: Pick<BuilderEvent, 'builderId'> })[]
) {
  const nfts = nftEvents.filter((nft) => nft.builderId === userId);
  const pointsFromNFTs = nfts.reduce((acc, nft) => {
    const builderPoints = getBuilderPointsFromGems(nft.builderId, receipts);
    const scoutSplit = getNFTScoutSplit(nft.contractAddress, nft.tokenId, nftEvents);
    return acc + builderPoints * scoutSplit;
  }, 0);
  return pointsFromNFTs + getBuilderPointsFromGems(userId, receipts);
}

// calculate a user's current points balance based on receipts
export function getCurrentPointsBalance(scoutId: string, receipts: PointsReceipt[]) {
  return receipts.reduce<number>((acc, receipt) => {
    if (receipt.recipientId === scoutId) {
      return acc + receipt.value;
    } else if (receipt.senderId === scoutId) {
      return acc - receipt.value;
    }
    return acc;
  }, 0);
}

// get points for: merge pull requests
export function getPointsEarnedAsBuilder(builderId: string, receipts: (PointsReceipt & { event: BuilderEvent })[]) {
  return receipts.reduce<number>((acc, receipt) => {
    if (receipt.recipientId === builderId) {
      // receipt from github events by builder
      if (receipt.event.type === 'merged_pull_request' && receipt.event.builderId === builderId) {
        return acc + receipt.value;
      }
    }
    return acc;
  }, 0);
}

// get points for: merge pull requests from other users
export function getPointsEarnedAsScout(scoutId: string, receipts: (PointsReceipt & { event: BuilderEvent })[]) {
  return receipts.reduce<number>((acc, receipt) => {
    if (receipt.recipientId === scoutId) {
      // receipt from github events by someone else
      if (receipt.event.type === 'merged_pull_request' && receipt.event.builderId !== scoutId) {
        return acc + receipt.value;
      }
      // receipt for payout
      if (receipt.event.type === 'gems_payout') {
        return acc + receipt.value;
      }
    }
    return acc;
  }, 0);
}

export async function getTopBuilders({ quantity, week }: { quantity: number; week: string }) {
  const userWeeklyStats = await prisma.userWeeklyStats.findMany({
    where: {
      week
    },
    orderBy: {
      gemsCollected: 'desc'
    },
    select: {
      user: {
        include: {
          events: {
            where: {
              type: 'merged_pull_request'
            },
            orderBy: {
              createdAt: 'asc'
            },
            take: 1,
            select: {
              createdAt: true
            }
          }
        }
      },
      gemsCollected: true
    }
  });

  // Sort based on gems collected first
  // If the gems are equal then order based on the earliest builder event created at date
  return userWeeklyStats
    .sort((a, b) => {
      if (a.gemsCollected === b.gemsCollected) {
        return a.user.events[0].createdAt.getTime() - b.user.events[0].createdAt.getTime();
      }
      return b.gemsCollected - a.gemsCollected;
    })
    .map((userWeeklyStat, index) => ({
      builder: userWeeklyStat.user,
      gemsCollected: userWeeklyStat.gemsCollected,
      rank: index + 1
    }))
    .slice(0, quantity);
}

export function calculatePointsForRank(rank: number) {
  const weeklyAllocatedPoints = getCurrentWeekPoints();
  return weeklyAllocatedPoints * ((1 - decayRate) ** (rank - 1) - (1 - decayRate) ** rank);
}
