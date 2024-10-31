import type { Prisma } from '@charmverse/core/prisma-client';

export const BasicUserInfoSelect = {
  id: true,
  path: true,
  displayName: true,
  avatar: true,
  bio: true,
  githubUser: {
    select: {
      login: true
    }
  },
  builderStatus: true,
  farcasterName: true
} satisfies Prisma.ScoutSelect;

export const MinimalScoutInfoSelect = {
  id: true,
  path: true,
  avatar: true,
  displayName: true
} satisfies Prisma.ScoutSelect;
