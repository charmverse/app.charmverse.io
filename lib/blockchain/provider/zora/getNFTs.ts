import type { UserWallet } from '@charmverse/core/prisma';

import { getNFTUrl } from 'components/common/CharmEditor/components/nft/utils';

import type { NFTData } from '../../getNFTs';

import { getClient } from './zoraClient';

export async function getNFTs({ wallets }: { wallets: Pick<UserWallet, 'address' | 'id'>[] }): Promise<NFTData[]> {
  const provider = getClient();
  if (!provider) {
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

  return response.tokens.nodes.map(({ token }) => ({
    id: `${token.collectionAddress}:${token.tokenId}`,
    tokenId: token.tokenId,
    tokenIdInt: parseInt(token.tokenId),
    contract: token.collectionAddress,
    imageRaw: token.image?.url?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '',
    image: token.image?.url?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '',
    imageThumb: token.image?.url?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '',
    title: token.name || '',
    description: token.description || '',
    chainId: token.tokenContract?.chain as number,
    timeLastUpdated: new Date(1970).toISOString(),
    isHidden: false,
    isPinned: false,
    link:
      getNFTUrl({
        chain: token.tokenContract?.chain as number,
        contract: token.collectionAddress,
        token: token.tokenId
      }) ?? '',
    walletId: wallets.find((wallet) => wallet.address === token.owner)?.id || null
  }));
}
