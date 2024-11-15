import { prisma } from '@charmverse/core/prisma-client';
import type { ProvableClaim } from '@charmverse/core/protocol';
import { getAllISOWeeksFromSeasonStart } from '@packages/scoutgame/dates';
import {
  protocolImplementationReadonlyApiClient,
  protocolProxyReadonlyApiClient
} from '@packages/scoutgame/protocol/clients/protocolReadClients';
import { getScoutProtocolAddress } from '@packages/scoutgame/protocol/constants';
import type { WeeklyClaimsTyped } from '@packages/scoutgame/protocol/generateWeeklyClaims';
import {
  scoutGameContributionReceiptSchemaUid,
  scoutGameUserProfileSchemaUid
} from '@packages/scoutgameattestations/constants';
import type { Address } from 'viem';

type MerkleRoot = {
  week: string;
  publishedOnchain: boolean;
  root: string | null;
  testClaim?: {
    claim: ProvableClaim;
    proofs: any[];
  };
};

export type ProtocolData = {
  admin: Address;
  proxy: Address;
  implementation: Address;
  claimsManager: Address;
  merkleRoots: MerkleRoot[];
  easSchemas: {
    profile: string;
    contributions: string;
  };
};

export async function aggregateProtocolData({ userId }: { userId?: string }): Promise<ProtocolData> {
  if (!getScoutProtocolAddress()) {
    throw new Error('REACT_APP_SCOUTPROTOCOL_CONTRACT_ADDRESS is not set');
  }

  const [implementation, admin, claimsManager] = await Promise.all([
    protocolProxyReadonlyApiClient.implementation(),
    protocolProxyReadonlyApiClient.admin(),
    protocolProxyReadonlyApiClient.claimsManager()
  ]);

  const weeks = getAllISOWeeksFromSeasonStart();

  const weeklyClaims = await prisma.weeklyClaims.findMany({
    where: {
      week: {
        in: weeks
      }
    }
  });

  const merkleRoots = await Promise.all<MerkleRoot>(
    weeks.map((week) =>
      protocolImplementationReadonlyApiClient
        .getMerkleRoot({ args: { week } })
        .then((root) => {
          const returnValue: MerkleRoot = { week, root, publishedOnchain: true };

          const weekFromDb = weeklyClaims.find((claim) => claim.week === week) as WeeklyClaimsTyped;

          if (userId && weekFromDb) {
            const userClaim = weekFromDb.claims.leavesWithUserId.find((_claim) => _claim.userId === userId);

            const proofs = weekFromDb.proofsMap[userId];

            if (userClaim && proofs) {
              returnValue.testClaim = {
                claim: userClaim,
                proofs
              };
            }
          }

          return returnValue;
        })
        .catch(() => {
          return {
            week,
            root: weeklyClaims.find((claim) => claim.week === week)?.merkleTreeRoot || null,
            publishedOnchain: false
          } as MerkleRoot;
        })
    )
  );

  return {
    merkleRoots,
    admin: admin as Address,
    proxy: getScoutProtocolAddress(),
    implementation: implementation as Address,
    claimsManager: claimsManager as Address,
    easSchemas: {
      contributions: scoutGameContributionReceiptSchemaUid(),
      profile: scoutGameUserProfileSchemaUid()
    }
  };
}
