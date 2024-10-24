import type { Prisma } from '@charmverse/core/prisma-client';

export const BasicUserInfoSelect = {
  id: true,
  username: true,
  avatar: true,
  bio: true,
  githubUser: {
    select: {
      login: true
    }
  },
  builderStatus: true
} satisfies Prisma.ScoutSelect;

export const MinimalScoutInfoSelect = {
  id: true,
  username: true,
  avatar: true,
  displayName: true
} satisfies Prisma.ScoutSelect;
