import type { NFTData } from '../../getNFTs';

import type { TokenActivityFromReservoirApi } from './client';
import { getClient } from './client';
import type { SupportedChainId } from './config';

export async function getNFT({
  address,
  tokenId,
  chainId
}: {
  address: string;
  tokenId: string;
  chainId: SupportedChainId;
}): Promise<NFTData | null> {
  const client = getClient({ chainId });

  const token = await client.getNFTMetaData(address, tokenId);

  console.log({ address, tokenId });

  if (!token) {
    return null;
  }

  console.log('DATA', token);

  return mapNFTData(token);
}

export function mapNFTData(
  token: TokenActivityFromReservoirApi,
  walletId: string | null = null,
  chainId: SupportedChainId = 324
): NFTData {
  return {
    id: `${token.contract}:${token.token.tokenId}`,
    tokenId: token.token.tokenId,
    tokenIdInt: Number(token.token.tokenId),
    contract: token.contract,
    imageRaw: token.token.tokenImage || '',
    image: token.token.tokenImage || '',
    imageThumb: token.token.tokenImage || '',
    title: `${token.collection.collectionName} - ${token.token.tokenName}`,
    description: '',
    chainId,
    timeLastUpdated: new Date(1970).toISOString(),
    isHidden: false,
    isPinned: false,
    link: '',
    walletId
  };
}
getNFT({ address: '0xf5ee3c34f14216f567842778ed3a5df3cd1128d9', tokenId: 2, chainId: 324 }).then(console.log);
