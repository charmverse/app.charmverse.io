export type CheckAvatar = {
  avatar?: string | null;
  avatarTokenId?: string | null;
};

export const hasNftAvatar = (data: CheckAvatar | null) => {
  return Boolean(data && data.avatar && data.avatarTokenId);
};
