import type { UserWallet } from '@charmverse/core/prisma';

import type { NFTData } from '../../getNFTs';

import { getClient } from './client';
import { mapNFTData } from './getNFT';

export async function getNFTs({ wallets }: { wallets: Pick<UserWallet, 'address' | 'id'>[] }): Promise<NFTData[]> {
  const mainnetClient = await getClient({ chainId: 324 });

  const walletStates = await Promise.all(wallets.map((w) => mainnetClient.getAccountState(w.address)));

  return walletStates
    .map((state) =>
      Object.values(state.committed.nfts).map((nft) =>
        mapNFTData(nft, wallets.find((w) => w.address === state.address)?.id, 324)
      )
    )
    .flat();
}
