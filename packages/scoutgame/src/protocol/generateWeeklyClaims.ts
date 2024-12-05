import { log } from '@charmverse/core/log';
import type { Prisma, WeeklyClaims } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { generateMerkleTree, getMerkleProofs } from '@charmverse/core/protocol';
import type { ProvableClaim } from '@charmverse/core/protocol';
import { v4 as uuid } from 'uuid';
import type { Address } from 'viem';

import { currentSeason } from '../dates';
import { dividePointsBetweenBuilderAndScouts } from '../points/dividePointsBetweenBuilderAndScouts';
import { getWeeklyPointsPoolAndBuilders } from '../points/getWeeklyPointsPoolAndBuilders';

import { protocolImplementationWriteClient } from './clients/protocolWriteClients';

type ProvableClaimWithUserId = ProvableClaim & {
  userId: string;
};

type ClaimsBody = {
  leaves: ProvableClaim[];
  leavesWithUserId: ProvableClaimWithUserId[];
};

export type WeeklyClaimsTyped = Omit<WeeklyClaims, 'claims' | 'proofsMap'> & {
  claims: ClaimsBody;
  proofsMap: Record<string, string[]>;
};

type WeeklyClaimsCalculated = {
  claims: ProvableClaim[];
  claimsWithUserId: ProvableClaimWithUserId[];
  builderEvents: Prisma.BuilderEventCreateManyInput[];
  tokenReceipts: Prisma.TokensReceiptCreateManyInput[];
  weeklyClaimId: string;
};

export async function calculateWeeklyClaims({ week }: { week: string }): Promise<WeeklyClaimsCalculated> {
  const { normalisationFactor, topWeeklyBuilders, weeklyAllocatedPoints } = await getWeeklyPointsPoolAndBuilders({
    week
  });

  const builderEvents: Prisma.BuilderEventCreateManyInput[] = [];
  const tokenReceipts: Prisma.TokensReceiptCreateManyInput[] = [];
  const weeklyClaimId = uuid();

  const allClaims = await Promise.all(
    topWeeklyBuilders.map(async (builder) => {
      const { pointsPerScout, pointsForBuilder } = await dividePointsBetweenBuilderAndScouts({
        builderId: builder.builder.id,
        normalisationFactor,
        weeklyAllocatedPoints,
        rank: builder.rank,
        season: currentSeason
      });

      const builderEventId = uuid();

      const builderEventInput: Prisma.BuilderEventCreateManyInput = {
        id: builderEventId,
        builderId: builder.builder.id,
        week,
        season: currentSeason,
        type: 'gems_payout',
        weeklyClaimId
      };

      builderEvents.push(builderEventInput);

      const builderTokenReceiptInput: Prisma.TokensReceiptCreateManyInput = {
        eventId: builderEventId,
        value: pointsForBuilder,
        recipientId: builder.builder.id
      };

      const scoutTokenReceipts: Prisma.TokensReceiptCreateManyInput[] = pointsPerScout.map((scoutClaim) => ({
        eventId: builderEventId,
        value: scoutClaim.scoutPoints,
        recipientId: scoutClaim.scoutId
      }));

      tokenReceipts.push(builderTokenReceiptInput, ...scoutTokenReceipts);

      return { pointsPerScout, pointsForBuilder, builderId: builder.builder.id };
    })
  );

  // Create the token receipts here

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
        wallets: true
      }
    })
    .then((_scouts) =>
      _scouts.reduce(
        (acc, val) => {
          const address = val.wallets[0]?.address as Address;

          if (address) {
            acc[val.id] = address;
          }
          return acc;
        },
        {} as Record<string, Address>
      )
    );

  const claimsWithUserId: ProvableClaimWithUserId[] = [];
  const claims: ProvableClaim[] = [];

  for (const scoutId of allScoutIds) {
    const walletAddress = scoutsWithWallet[scoutId];

    if (!walletAddress) {
      log.warn(`Scout ${scoutId} does not have a wallet address`);
    } else {
      const claim: ProvableClaim = {
        address: walletAddress,
        amount: claimsMap[scoutId]
      };

      claims.push(claim);
      claimsWithUserId.push({ ...claim, userId: scoutId });
    }
  }

  return { claims, claimsWithUserId, builderEvents, weeklyClaimId, tokenReceipts };
}

export async function generateWeeklyClaims({
  week
}: {
  week: string;
}): Promise<{ weeklyClaims: WeeklyClaimsTyped; totalBuilders: number; totalPoints: number }> {
  const existingClaim = await prisma.weeklyClaims.findUnique({
    where: {
      week
    }
  });

  if (existingClaim) {
    throw new Error(`Claims for week ${week} already exist`);
  }

  const { claims, claimsWithUserId, builderEvents, tokenReceipts, weeklyClaimId } = await calculateWeeklyClaims({
    week
  });

  const { rootHash, tree } = generateMerkleTree(claims);

  const proofsMap: Record<string, string[]> = {};

  for (const claim of claimsWithUserId) {
    const proof = getMerkleProofs(tree, { address: claim.address, amount: claim.amount });

    proofsMap[claim.userId] = proof;
  }

  const claimsBody: ClaimsBody = {
    leaves: claims,
    leavesWithUserId: claimsWithUserId
  };

  await protocolImplementationWriteClient().setMerkleRoot({
    args: {
      merkleRoot: `0x${rootHash}`,
      week
    }
  });

  const [weeklyClaim] = await prisma.$transaction([
    prisma.weeklyClaims.create({
      data: {
        id: weeklyClaimId,
        week,
        merkleTreeRoot: rootHash,
        season: currentSeason,
        totalClaimable: claims.reduce((acc, claim) => acc + claim.amount, 0),
        claims: claimsBody,
        proofsMap
      }
    }),
    prisma.builderEvent.createMany({
      data: builderEvents
    }),
    prisma.tokensReceipt.createMany({
      data: tokenReceipts
    })
  ]);

  return {
    weeklyClaims: weeklyClaim as WeeklyClaimsTyped,
    totalBuilders: builderEvents.length,
    totalPoints: tokenReceipts.length
  };
}
