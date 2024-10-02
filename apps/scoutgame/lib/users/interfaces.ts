import type { BuilderStatus } from '@charmverse/core/prisma';

export type MinimalUserInfo = {
  id: string;
  username: string;
  avatar?: string | null;
  displayName: string;
};

export type BasicUserInfo = MinimalUserInfo & {
  bio?: string | null;
  githubLogin?: string;
  builderStatus: BuilderStatus | null;
};
