export type BasicUserInfo = {
  username: string;
  avatar: string | null;
};

export type BuilderUserInfo = BasicUserInfo & {
  gems?: number;
  scouts?: number;
  likes?: number;
  nfts?: number;
  price: number;
};
