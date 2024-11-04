import { log } from '@charmverse/core/log';
import type { WeeklyClaims } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';

import { currentSeason } from '../dates';
import { dividePointsBetweenBuilderAndScouts } from '../points/dividePointsBetweenBuilderAndScouts';
import { getWeeklyPointsPoolAndBuilders } from '../points/getWeeklyPointsPoolAndBuilders';

import { generateMerkleTree, type ProvableClaim } from './merkleTree';

type ClaimsBody = {
  leaves: ProvableClaim[];
};

type WeeklyClaimsTyped = Omit<WeeklyClaims, 'claims'> & {
  claims: ClaimsBody;
};

export async function calculateWeeklyClaims({ week }: { week: string }): Promise<ProvableClaim[]> {
  const { normalisationFactor, topWeeklyBuilders, weeklyAllocatedPoints } = await getWeeklyPointsPoolAndBuilders({
    week
  });

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
          const address = val.scoutWallet[0]?.address as Address;

          if (address) {
            acc[val.id] = address;
          }
          return acc;
        },
        {} as Record<string, Address>
      )
    );

  const claimsByAddress: ProvableClaim[] = [];

  for (const scoutId of allScoutIds) {
    const walletAddress = scoutsWithWallet[scoutId];

    if (!walletAddress) {
      log.warn(`Scout ${scoutId} does not have a wallet address`);
    } else {
      const claim: ProvableClaim = {
        address: walletAddress,
        amount: claimsMap[scoutId]
      };

      claimsByAddress.push(claim);
    }
  }

  return claimsByAddress;
}

export async function generateWeeklyClaims({ week }: { week: string }): Promise<WeeklyClaimsTyped> {
  const existingClaim = await prisma.weeklyClaims.findUnique({
    where: {
      week
    }
  });

  if (existingClaim) {
    throw new Error(`Claims for week ${week} already exist`);
  }

  const claims = await calculateWeeklyClaims({ week });

  const { rootHash } = generateMerkleTree(claims);

  const claimsBody: ClaimsBody = {
    leaves: claims
  };

  const weeklyClaim = await prisma.weeklyClaims.create({
    data: {
      week,
      merkleTreeRoot: rootHash,
      season: currentSeason,
      totalClaimable: claims.reduce((acc, claim) => acc + claim.amount, 0),
      claims: claimsBody
    }
  });

  return weeklyClaim as WeeklyClaimsTyped;
}

// generateWeeklyClaims({ week: '2024-W44' }).then(console.log);
