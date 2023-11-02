import { getClient } from './client';

export async function verifyNFTOwner({
  ownerAddresses,
  contractAddress,
  tokenId
}: {
  ownerAddresses: string[];
  contractAddress: string;
  tokenId: string;
}): Promise<boolean> {
  const provider = getClient();
  if (!provider) {
    return false;
  }

  const response = await provider.token({
    token: {
      address: contractAddress,
      tokenId
    },
    includeFullDetails: false // Optional, provides more data on the NFTs such as events
  });

  return !!(response.token?.token.owner && ownerAddresses.includes(response.token?.token.owner));
}
