import type { SupportedChainId } from './provider/alchemy';

export interface NftData {
  id: string;
  tokenId: string;
  tokenIdInt: number | null;
  contract: string;
  title: string;
  description: string;
  chainId: SupportedChainId;
  image: string;
  imageRaw: string;
  imageThumb?: string;
  timeLastUpdated: string;
  isHidden: boolean;
}

export interface ExtendedPoap {
  id: string;
  imageURL: string;
  isHidden: boolean;
  walletAddress: string;
  tokenId: string;
  created: string;
  name: string;
}

export interface AuthSig {
  sig: string;
  derivedVia: string;
  signedMessage: string;
  address: string;
}
