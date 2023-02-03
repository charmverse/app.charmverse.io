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
  isPinned: boolean;
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

/**
 * @param rawAddress - Account as detected, without any lowercasing
 */
export interface AuthSig {
  sig: string;
  derivedVia: string;
  signedMessage: string;
  address: string;
}

export interface Collectable {
  title: string;
  date: string;
  id: string;
  image: string;
  type: 'poap' | 'nft';
  link: string;
  isHidden: boolean;
}
