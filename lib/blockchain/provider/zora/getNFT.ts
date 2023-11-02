import type { TokenResponseItem } from '@zoralabs/zdk';
import { ZDKChain, ZDKNetwork } from '@zoralabs/zdk';

import { getNFTUrl } from 'components/common/CharmEditor/components/nft/utils';

import type { NFTData } from '../../getNFTs';

import type { SupportedChainId } from './zoraClient';
import { getClient } from './zoraClient';

export async function getNFT({
  address,
  tokenId,
  chainId
}: {
  address: string;
  tokenId: string;
  chainId: SupportedChainId;
}): Promise<NFTData | null> {
  const provider = getClient();
  if (!provider) {
    return null;
  }

  const response = await provider.token({
    token: {
      address,
      tokenId
    },
    network: {
      network: ZDKNetwork.Zora,
      chain: chainId === 999 ? ZDKChain.ZoraGoerli : ZDKChain.ZoraMainnet
    },
    // pagination: { limit: 3 }, // Optional, limits the response size to 3 NFTs
    includeFullDetails: false // Optional, provides more data on the NFTs such as events
  });
  const token = response.token?.token;
  if (!token) {
    return null;
  }
  return mapNFTData(token);
}

export function mapNFTData(token: TokenResponseItem['token'], walletId: string | null = null) {
  return {
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
    walletId
  };
}
