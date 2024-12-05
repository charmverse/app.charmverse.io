import { InvalidInputError } from '@charmverse/core/errors';
import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { builderPointsShare, scoutPointsShare } from '../builderNfts/constants';
import { calculateEarnableScoutPointsForRank } from '../points/calculatePoints';

const nftTypeMultipliers: Record<BuilderNftType, number> = {
  season_1_starter_pack: 1,
  default: 10
};

/**
 * Function to calculate scout points
 * @param builderId - ID of the builder
 * @param season - Season identifier
 * @param rank - Rank of the builder
 * @param weeklyAllocatedPoints - Points allocated for the week
 * @param normalisationFactor - Normalisation factor for points to ensure we hit the full quota allocated
 * @returns {Promise<{ totalNftsPurchased: number, nftsByScout: Record<string, number>, earnableScoutPoints: number }>}
 */
export async function dividePointsBetweenBuilderAndScouts({
  builderId,
  season,
  rank,
  weeklyAllocatedPoints,
  normalisationFactor
}: {
  builderId: string;
  season: string;
  rank: number;
  weeklyAllocatedPoints: number;
  normalisationFactor: number;
}) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId must be a valid UUID');
  }

  if (rank < 1 || typeof rank !== 'number') {
    throw new InvalidInputError('Invalid rank provided. Must be a number greater than 0');
  }

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNFT: {
        season,
        builderId
      }
    },
    select: {
      scoutId: true,
      tokensPurchased: true,
      builderNFT: {
        select: {
          nftType: true
        }
      }
    }
  });

  const { totalNftsPurchased, nftsByScout } = nftPurchaseEvents.reduce(
    (acc, purchaseEvent) => {
      // Normal NFTs are 10x more valuable than Starter Pack NFTs
      const multiplier = nftTypeMultipliers[purchaseEvent.builderNFT.nftType];
      const totalPurchased = purchaseEvent.tokensPurchased * multiplier;

      acc.totalNftsPurchased += totalPurchased;
      acc.nftsByScout[purchaseEvent.scoutId] = (acc.nftsByScout[purchaseEvent.scoutId] || 0) + totalPurchased;
      return acc;
    },
    {
      totalNftsPurchased: 0,
      nftsByScout: {} as Record<string, number>
    }
  );

  const earnableScoutPoints = Math.floor(
    calculateEarnableScoutPointsForRank({ rank, weeklyAllocatedPoints }) * normalisationFactor
  );

  const pointsPerScout = Object.entries(nftsByScout).map(([scoutId, tokensPurchased]) => {
    const scoutPoints = Math.floor(scoutPointsShare * earnableScoutPoints * (tokensPurchased / totalNftsPurchased));

    return { scoutId, scoutPoints };
  });

  const pointsForBuilder = Math.floor(builderPointsShare * earnableScoutPoints);

  return { totalNftsPurchased, nftsByScout, earnableScoutPoints, pointsPerScout, pointsForBuilder };
}
