export type MinimalUserInfo = {
  id: string;
  username: string;
  avatar?: string | null;
  displayName: string;
};

export type BasicUserInfo = MinimalUserInfo & {
  bio?: string | null;
  githubLogin?: string;
  builder: boolean;
};
