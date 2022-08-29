export type NftData = {
  tokenId: string
  tokenIdInt: number | null
  contract: string;
  title: string;
  description: string
  chainId: number
  image: string;
  imageRaw: string;
  imageThumb?: string
  timeLastUpdated: string
  isHidden: boolean
}
