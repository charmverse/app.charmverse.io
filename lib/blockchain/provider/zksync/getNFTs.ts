import type { UserWallet } from '@charmverse/core/prisma';

import type { NFTData } from '../../getNFTs';

import { getClient } from './client';
import type { SupportedChainId } from './config';
import { mapNFTData } from './getNFT';

export async function getNFTs({ wallets }: { wallets: Pick<UserWallet, 'address' | 'id'>[] }): Promise<NFTData[]> {
  const mainnetProvider = await getClient({ chainId: 324 });
  const testnetProvider = await getClient({ chainId: 280 });

  const walletStates = await Promise.all(
    [
      ...wallets.map((w) => [
        mainnetProvider.getState(w.address).then((s) => ({ ...s, chainId: 324 as SupportedChainId })),
        testnetProvider.getState(w.address).then((s) => ({ ...s, chainId: 280 as SupportedChainId }))
      ])
    ].flat()
  );

  return walletStates
    .map((state) =>
      Object.values(state.committed.nfts).map((nft) =>
        mapNFTData(nft, wallets.find((w) => w.address === state.address)?.id, state.chainId)
      )
    )
    .flat();
}
