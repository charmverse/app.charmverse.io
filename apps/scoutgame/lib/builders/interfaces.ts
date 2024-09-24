export type BasicUserInfo = {
  id: string;
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
