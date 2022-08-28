import * as alchemyApi from 'lib/blockchain/provider/alchemy';
import { mapNftFromAlchemy } from 'lib/nft/utilities/mapNftFromAlchemy';

export async function getNFTs (addresses: string[]) {
  const chainId = 1;
  const nfts = await alchemyApi.getNfts(addresses, chainId);
  const mappedNfts = nfts.map(nft => mapNftFromAlchemy(nft, chainId));
  return mappedNfts;
}
