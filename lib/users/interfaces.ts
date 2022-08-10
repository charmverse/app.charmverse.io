
export type UserAvatar = {
  avatar: string | null
} & (
  { avatarContract: string; avatarTokenId: string; avatarTokenChain: number } |
  { avatarContract: null; avatarTokenId: null; avatarTokenChain: null }
)

export interface SetAvatarRequest {
  url: string;
  contractAddress?: string | null;
  tokenId?: string | null
}
