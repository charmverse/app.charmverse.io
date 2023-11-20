import type { UserWallet } from '@charmverse/core/prisma';

import { fetchFileByHash } from 'lib/ipfs/fetchFileByHash';

import type { NFTData } from '../../getNFTs';

import { getClient } from './client';
import { getNFT, mapNFTData } from './getNFT';

export async function getNFTs({ wallets }: { wallets: Pick<UserWallet, 'address' | 'id'>[] }): Promise<NFTData[]> {
  const mainnetClient = await getClient({ chainId: 324 });

  const walletStates = await Promise.all(wallets.map((w) => mainnetClient.getAccountState(w.address)));

  console.log('States', JSON.stringify(walletStates, null, 2));

  const allNfts = (
    await Promise.all(
      walletStates
        .map((state) =>
          Object.values(state.committed?.nfts ?? []).map((nft) =>
            getNFT({ address: nft.address, tokenId: String(nft.serialId), chainId: 324 })
          )
        )
        .flat()
    )
  ).filter((value) => !!value) as NFTData[];

  return allNfts;
}
getNFTs({ wallets: [{ address: '0xf729372576390685b1ed63802ab74e85c4aa0caa', id: '1' }] }).then(console.log);
