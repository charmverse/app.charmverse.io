import { AlchemyNft } from 'lib/blockchain/provider/interfaces';
import { NftData } from 'lib/nft/interfaces';

export const mapNftFromAlchemy = (nft: AlchemyNft, chainId: number): NftData => {
  return {
    tokenId: nft.id.tokenId,
    tokenIdInt: parseInt(nft.id.tokenId, 16) || null,
    contract: nft.contract.address,
    imageRaw: nft.media[0].raw,
    image: nft.media[0].raw?.startsWith('https://') ? nft.media[0].raw : nft.media[0].gateway,
    imageThumb: nft.media[0].thumbnail,
    title: nft.title,
    description: nft.description,
    chainId,
    timeLastUpdated: nft.timeLastUpdated
  };
};
