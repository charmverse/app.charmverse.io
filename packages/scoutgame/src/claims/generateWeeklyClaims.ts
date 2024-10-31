import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';

import { currentSeason } from '../dates';
import { dividePointsBetweenBuilderAndScouts } from '../points/dividePointsBetweenBuilderAndScouts';
import { getWeeklyPointsPoolAndBuilders } from '../points/getWeeklyPointsPoolAndBuilders';

import type { ProvableClaim } from './root';

export async function generateWeeklyClaims({ week }: { week: string }): Promise<ProvableClaim[]> {
  const { normalisationFactor, topWeeklyBuilders, totalPoints, weeklyAllocatedPoints } =
    await getWeeklyPointsPoolAndBuilders({ week });

  const allClaims = await Promise.all(
    topWeeklyBuilders.map(async (builder) => {
      const { pointsPerScout, pointsForBuilder } = await dividePointsBetweenBuilderAndScouts({
        builderId: builder.builder.id,
        normalisationFactor,
        weeklyAllocatedPoints,
        rank: builder.rank,
        season: currentSeason
      });

      return { pointsPerScout, pointsForBuilder, builderId: builder.builder.id };
    })
  );

  const claimsMap: Record<string, number> = {};

  for (const claimSet of allClaims) {
    if (!claimsMap[claimSet.builderId]) {
      claimsMap[claimSet.builderId] = 0;
    }
    claimsMap[claimSet.builderId] += claimSet.pointsForBuilder;

    for (const scoutClaim of claimSet.pointsPerScout) {
      if (!claimsMap[scoutClaim.scoutId]) {
        claimsMap[scoutClaim.scoutId] = 0;
      }
      claimsMap[scoutClaim.scoutId] += scoutClaim.scoutPoints;
    }
  }

  const allScoutIds = Object.keys(claimsMap);

  const scoutsWithWallet = await prisma.scout
    .findMany({
      where: {
        id: {
          in: allScoutIds
        }
      },
      select: {
        id: true,
        scoutWallet: true
      }
    })
    .then((_scouts) =>
      _scouts.reduce(
        (acc, val) => {
          acc[val.id] = val.scoutWallet[0].address as Address;
          return acc;
        },
        {} as Record<string, Address>
      )
    );

  const claimsByAddress: ProvableClaim[] = [];

  for (const scoutId of allScoutIds) {
    const walletAddress = scoutsWithWallet[scoutId];

    if (!walletAddress) {
      throw new Error(`Scout ${scoutId} does not have a wallet address`);
    }

    const claim: ProvableClaim = {
      address: walletAddress,
      amount: claimsMap[scoutId]
    };

    claimsByAddress.push(claim);
  }

  return claimsByAddress;
}
