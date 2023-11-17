import { zkMainnetClient, zkTestnetClient } from './client';

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
  for (const wallet of ownerAddresses) {
    const mainnetState = await zkMainnetClient.getAccountState(wallet);

    if (mainnetState.committed.nfts[Number(tokenId)]) {
      return true;
    }

    const testnetState = await zkTestnetClient.getAccountState(wallet);

    if (testnetState.committed.nfts[Number(tokenId)]) {
      return true;
    }
  }

  return false;
}
