import type {
  BuilderNft,
  BuilderEvent,
  GemsReceipt,
  NFTPurchaseEvent,
  PointsReceipt
} from '@charmverse/core/prisma-client';

import { weeklyAllocatedPoints } from '../dates';

const gemsToPoints = 1;
const decayRate = 0.03;

type BuilderNftMeta = Pick<BuilderNft, 'builderId' | 'contractAddress' | 'tokenId'>;

type NFTPurchaseEventWithBuilderNftMeta = NFTPurchaseEvent & { builderNft: BuilderNftMeta };

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
export function getNFTScoutSplit(contract: string, tokenId: number, nftEvents: NFTPurchaseEventWithBuilderNftMeta[]) {
  const nfts = nftEvents.filter((nft) => nft.builderNft.contractAddress === contract);
  // TODO: apply actual equation
  return 100 / nfts.length;
}

// get the points for a user based on NFTs and gem receipts
export function getPointsFromGems(
  userId: string,
  nftEvents: NFTPurchaseEventWithBuilderNftMeta[],
  receipts: (GemsReceipt & { event: Pick<BuilderEvent, 'builderId'> })[]
) {
  const nfts = nftEvents.filter((nft) => nft.builderNft.builderId === userId);
  const pointsFromNFTs = nfts.reduce((acc, nft) => {
    const builderPoints = getBuilderPointsFromGems(nft.builderNft.builderId, receipts);
    const scoutSplit = getNFTScoutSplit(nft.builderNft.contractAddress, nft.builderNft.tokenId, nftEvents);
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

export function customCalculateEarnableScoutPointsForRank({ rank, points }: { rank: number; points: number }) {
  return points * ((1 - decayRate) ** (rank - 1) - (1 - decayRate) ** rank);
}

export function calculateEarnableScoutPointsForRank(rank: number) {
  return customCalculateEarnableScoutPointsForRank({ rank, points: weeklyAllocatedPoints });
}
