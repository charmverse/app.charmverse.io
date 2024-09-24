export type BasicUserInfo = {
  username: string;
  avatar: string | null;
};

export type BuilderInfo = {
  id: string;
  nftAvatar: string;
  username: string;
  displayName: string;
  builderPoints?: number;
  price?: number;
  gems?: number;
  nfts?: number;
  isBanned?: boolean;
  scoutedBy?: number;
};
