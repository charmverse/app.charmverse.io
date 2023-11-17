import type { NFTInfo } from 'zksync/build/types';

import type { NFTData } from '../../getNFTs';

import { getClient } from './client';
import type { SupportedChainId } from './config';

export async function getNFT({
  tokenId,
  chainId
}: {
  tokenId: number;
  chainId: SupportedChainId;
}): Promise<NFTData | null> {
  const client = getClient({ chainId });

  const token = await client.getNFTInfo(tokenId);

  return mapNFTData(token);
}

export function mapNFTData(
  token: Pick<NFTInfo, 'id' | 'serialId' | 'address' | 'contentHash'>,
  walletId: string | null = null,
  chainId: SupportedChainId = 324
): NFTData {
  const tokenImageUrl = token.contentHash ? `https://ipfs.io/ipfs/${token.contentHash}` : '';

  return {
    id: token.id.toString(),
    tokenId: token.serialId.toString(),
    tokenIdInt: token.serialId,
    contract: token.address,
    imageRaw: tokenImageUrl,
    image: tokenImageUrl,
    imageThumb: tokenImageUrl,
    title: '',
    description: '',
    chainId,
    timeLastUpdated: new Date(1970).toISOString(),
    isHidden: false,
    isPinned: false,
    link: '',
    walletId
  };
}
