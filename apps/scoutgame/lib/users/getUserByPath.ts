import { prisma } from '@charmverse/core/prisma-client';

import type { BasicUserInfo } from './interfaces';
import { BasicUserInfoSelect } from './queries';

export async function getUserByPath(username: string): Promise<BasicUserInfo | null> {
  const user = await prisma.scout.findFirst({
    where: {
      username
    },
    select: BasicUserInfoSelect
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    githubLogin: user?.githubUser[0]?.login
  };
}
