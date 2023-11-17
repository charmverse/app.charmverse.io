import { getClient } from './client';

/**
 * @tokenId - An integer representing the ZKSync token id
 */
export async function verifyNFTOwner({
  ownerAddresses,
  tokenId
}: {
  ownerAddresses: string[];
  tokenId: number | string;
}): Promise<boolean> {
  const provider = await getClient({ chainId: 324 });

  for (const wallet of ownerAddresses) {
    const state = await provider.getAccountState(wallet);

    if (state.committed.nfts[Number(tokenId)]) {
      return true;
    }
  }

  return false;
}
