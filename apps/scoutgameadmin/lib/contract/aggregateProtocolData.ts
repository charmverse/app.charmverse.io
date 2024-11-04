import { prisma } from '@charmverse/core/prisma-client';
import { getAllISOWeeksFromSeasonStart } from '@packages/scoutgame/dates';
import {
  protocolImplementationReadonlyApiClient,
  protocolProxyReadonlyApiClient
} from '@packages/scoutgame/protocol/clients/protocolReadClients';
import { getScoutProtocolAddress } from '@packages/scoutgame/protocol/constants';
import type { Address } from 'viem';

type MerkleRoot = {
  week: string;
  publishedOnchain: boolean;
  root: string | null;
};

export type ProtocolData = {
  admin: Address;
  proxy: Address;
  implementation: Address;
  claimsManager: Address;
  merkleRoots: MerkleRoot[];
};

export async function aggregateProtocolData(): Promise<ProtocolData> {
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
        .then((root) => ({ week, root, publishedOnchain: true }) as MerkleRoot)
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
    claimsManager: claimsManager as Address
  };
}
