type NftMedia = {
  bytes: number
  format: string
  gateway: string
  raw: string
  thumbnail: string
}

export type AlchemyNft = {
  contract: { address: string },
  id: { tokenId: string },
  title: string
  description: string
  tokenUri: {
    raw: string,
    gateway: string
  },
  media: NftMedia[]
  timeLastUpdated: string
}

export type AlchemyNftResponse = {
  blockHash: string,
  ownedNfts: AlchemyNft[],
  totalCount: number
}
