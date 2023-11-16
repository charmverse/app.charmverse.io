import * as zksync from 'zksync';

import { GET } from 'adapters/http/index';

import { ZK_ERA_API_ENDPOINT, getClient } from './client';

export async function verifyNFTOwner({
  ownerAddresses,
  tokenId
}: {
  ownerAddresses: string[];
  tokenId: number;
}): Promise<boolean> {
  throw new Error('Cannot verify ownership on ZKSync');

  const provider = await getClient({ chainId: 324 });

  //  const nftOwner = await provider.getNFT(tokenId);

  for (const wallet of ownerAddresses) {
    const state = await provider.getState(wallet);

    if (state.committed.nfts[tokenId]) {
      return true;
    }
  }

  return false;
}
