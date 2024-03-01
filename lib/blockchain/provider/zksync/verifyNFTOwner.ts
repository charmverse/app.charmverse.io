import { lowerCaseEqual } from 'lib/utils/strings';

import { getClient } from './client';
import type { SupportedChainId } from './config';

/**
 * @tokenId - An integer representing the ZKSync token id
 */
export async function verifyNFTOwner({
  ownerAddresses,
  tokenId,
  chainId,
  contractAddress
}: {
  contractAddress: string;
  ownerAddresses: string[];
  tokenId: number | string;
  chainId: SupportedChainId;
}): Promise<boolean> {
  const client = getClient({ chainId });

  const contract = client.getNftContract(contractAddress);

  const owner = await contract.functions.ownerOf(tokenId).then((data) => data.owner);
  return ownerAddresses.some((a) => lowerCaseEqual(a, owner));
}
