
export type UserAvatar = {
  avatar: string | null
} & (
  { contractAddress: string; tokenId: string; tokenChain: number } |
  { contractAddress: null; tokenId: null; tokenChain: null }
)

export interface SetAvatarRequest {
  url: string;
  contractAddress?: string | null;
  tokenId?: string | null
}
