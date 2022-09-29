
export type CheckAvatar = {
  avatar?: string | null;
  avatarContract?: string | null;
  avatarTokenId?: string | null;
   avatarChain?: number | null;
}

export const hasNftAvatar = (data: CheckAvatar | null) => {
  return Boolean(data && data.avatar && data.avatarContract && data.avatarChain && data.avatarTokenId);
};
