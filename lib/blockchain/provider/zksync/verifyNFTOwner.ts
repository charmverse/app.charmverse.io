import * as zksync from 'zksync';

import { GET } from 'adapters/http/index';

import { ZK_ERA_API_ENDPOINT, getClient } from './client';
import { getNFT } from './getNFT';

export async function verifyNFTOwner({
  ownerAddresses,
  tokenId
}: {
  ownerAddresses: string[];
  tokenId: number;
}): Promise<boolean> {
  //  throw new Error('Cannot verify ownership on ZKSync')

  const provider = await getClient({ chainId: 324 });

  //  const nft = await getNFT({ chainId: 324, tokenId: 499586200103 });

  //  const nftOwner = await provider.getNFT(tokenId);

  for (const wallet of ownerAddresses) {
    const state = await provider.getState(wallet);

    console.log(JSON.stringify(state, null, 2));

    if (state.committed.nfts[tokenId]) {
      return true;
    }
  }

  return false;
}
verifyNFTOwner({ ownerAddresses: ['0xed1fd273e12b11367631af1e83ff219a67b9c951'], tokenId: 499586200103 }).then(
  (result) => console.log(result)
);
