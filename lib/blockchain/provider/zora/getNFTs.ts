import type { UserWallet } from '@charmverse/core/prisma';

import type { NFTData } from '../../getNFTs';

import { getClient } from './client';
import { mapNFTData } from './getNFT';

export async function getNFTs({ wallets }: { wallets: Pick<UserWallet, 'address' | 'id'>[] }): Promise<NFTData[]> {
  const provider = getClient();
  if (!provider || wallets.length === 0) {
    return [];
  }
  // test wallet
  // wallets = [{ id: 'foo', address: '0x462bc7960c1f928B49d82e5df372d7a7779abC95' }];

  const response = await provider.tokens({
    where: {
      ownerAddresses: wallets.map((wallet) => wallet.address)
    },
    // pagination: { limit: 3 }, // Optional, limits the response size to 3 NFTs
    includeFullDetails: false, // Optional, provides more data on the NFTs such as events
    includeSalesHistory: false // Optional, provides sales data on the NFTs}
  });

  return response.tokens.nodes.map(({ token }) =>
    mapNFTData(token, wallets.find((wallet) => wallet.address === token.owner)?.id)
  );
}
