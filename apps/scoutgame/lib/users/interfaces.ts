import type { BuilderStatus } from '@charmverse/core/prisma';

export type MinimalUserInfo = {
  id: string;
  username: string | null;
  path: string | null;
  avatar?: string | null;
};

export type BasicUserInfo = MinimalUserInfo & {
  bio?: string | null;
  githubLogin?: string;
};

export type BuilderUserInfo = MinimalUserInfo & {
  githubLogin?: string;
  builderStatus: BuilderStatus;
};
