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
