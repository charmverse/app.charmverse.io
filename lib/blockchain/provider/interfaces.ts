export interface NftMedia {
  bytes: number;
  format: string;
  gateway: string;
  raw: string;
  thumbnail: string;
}

export interface AlchemyNft {
  contract: {
    address: string;
  };
  id: {
    tokenId: string;
  };
  title: string;
  description: string;
  tokenUri: {
    raw: string;
    gateway: string;
  };
  media: NftMedia[];
  timeLastUpdated: string;
}

export interface AlchemyNftResponse {
  blockHash: string;
  ownedNfts: AlchemyNft[];
  totalCount: number;
}
