import type { Collectable, NftData } from './interfaces';

export function transformNft(nft: NftData): Collectable {
  const tokenId = nft.tokenId.startsWith('0x') ? parseInt(nft.tokenId, 16) : nft.tokenId;
  return {
    type: 'nft',
    date: nft.timeLastUpdated,
    id: nft.id,
    image: nft.image ?? nft.imageThumb,
    title: nft.title,
    link:
      nft.chainId === 42161
        ? `https://stratosnft.io/assets/${nft.contract}/${tokenId}`
        : `https://opensea.io/assets/${nft.chainId === 1 ? 'ethereum' : 'matic'}/${nft.contract}/${tokenId}`,
    isHidden: nft.isHidden,
    walletAddress: nft.walletAddress
  };
}
