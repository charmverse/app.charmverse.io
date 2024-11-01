import { getAllISOWeeksFromSeasonStart } from '@packages/scoutgame/dates';
import {
  protocolImplementationReadonlyApiClient,
  protocolProxyReadonlyApiClient
} from '@packages/scoutgame/protocol/clients/protocolReadClients';
import { getScoutProtocolAddress } from '@packages/scoutgame/protocol/constants';
import type { Address } from 'viem';

type MerkleRoot = {
  week: string;
  root: string;
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

  const merkleRoots = await Promise.all(
    weeks.map((week) =>
      protocolImplementationReadonlyApiClient
        .getMerkleRoot({ args: { week } })
        .then((root) => ({ week, root }))
        .catch(() => {
          return { week, root: 'No root found' };
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
