import type { UserWallet } from '@charmverse/core/prisma';
import { zkSync, zksyncSepoliaTestnet } from 'viem/chains';

import type { NFTData } from '../../getNFTs';

import { getClient } from './client';

export async function getNFTs({ wallets }: { wallets: Pick<UserWallet, 'address' | 'id'>[] }): Promise<NFTData[]> {
  const mainnetClient = getClient({ chainId: zkSync.id });
  const testnetClient = getClient({ chainId: zksyncSepoliaTestnet.id });

  const nftData = (
    await Promise.all(
      wallets.map(({ address, id }) =>
        Promise.all(
          [mainnetClient, testnetClient].map((client) => client.getUserNfts({ walletAddress: address, walletId: id }))
        )
      )
    )
  ).flat(2);
  return nftData;
}
