import type { BuilderStatus } from '@charmverse/core/prisma';

export type MinimalUserInfo = {
  id: string;
  displayName: string;
  path: string;
  avatar?: string | null;
  farcasterUsername?: string | null;
};

export type BasicUserInfo = MinimalUserInfo & {
  bio?: string | null;
  githubLogin?: string;
};

export type BuilderUserInfo = MinimalUserInfo & {
  githubLogin?: string;
  builderStatus: BuilderStatus;
};
