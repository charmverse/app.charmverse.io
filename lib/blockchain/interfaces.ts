export interface ExtendedPoap {
  id: string;
  imageURL: string;
  isHidden: boolean;
  walletAddress: string;
  tokenId: string;
  created: string;
  name: string;
  walletId: string | null;
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
  walletId: string | null;
}
