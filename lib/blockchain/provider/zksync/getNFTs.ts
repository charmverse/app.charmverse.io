import type { UserWallet } from '@charmverse/core/prisma';

import type { NFTData } from '../../getNFTs';

import { getClient } from './client';

export async function getNFTs({ wallets }: { wallets: Pick<UserWallet, 'address' | 'id'>[] }): Promise<NFTData[]> {
  const mainnetClient = getClient({ chainId: 324 });
  const testnetClient = getClient({ chainId: 280 });

  const nftData = (
    await Promise.all(
      wallets.map(({ address }) =>
        Promise.all([mainnetClient, testnetClient].map((client) => client.getUserNfts({ walletAddress: address })))
      )
    )
  ).flat(2);
  return nftData;
}
