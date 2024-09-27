import type { Prisma } from '@charmverse/core/prisma-client';

export const BasicUserInfoSelect = {
  id: true,
  username: true,
  avatar: true,
  displayName: true,
  bio: true,
  githubUser: {
    select: {
      login: true
    }
  },
  builderStatus: true
} satisfies Prisma.ScoutSelect;
