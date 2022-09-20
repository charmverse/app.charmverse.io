import type { NftData } from './interfaces';
import * as alchemyApi from './provider/alchemy';

export async function getNFTs (addresses: string[], chainId: alchemyApi.SupportedChainId = 1) {
  const nfts = await alchemyApi.getNFTs(addresses, chainId);
  const mappedNfts = nfts.map(nft => mapNftFromAlchemy(nft, chainId));
  return mappedNfts;
}

export async function getNFT (contractAddress: string, tokenId: string, chainId: alchemyApi.SupportedChainId = 1) {
  const nft = await alchemyApi.getNFT(contractAddress, tokenId, chainId);
  return mapNftFromAlchemy(nft, chainId);
}

function mapNftFromAlchemy (nft: alchemyApi.AlchemyNft, chainId: alchemyApi.SupportedChainId): NftData {
  return {
    id: `${nft.contract.address}:${nft.id.tokenId}`,
    tokenId: nft.id.tokenId,
    tokenIdInt: parseInt(nft.id.tokenId, 16) || null,
    contract: nft.contract.address,
    imageRaw: nft.media[0].raw,
    image: nft.media[0].raw?.startsWith('https://') ? nft.media[0].raw : nft.media[0].gateway,
    imageThumb: nft.media[0].thumbnail,
    title: nft.title,
    description: nft.description,
    chainId,
    timeLastUpdated: nft.timeLastUpdated,
    isHidden: false
  };
}
