import { prisma } from '@charmverse/core/prisma-client';
import { replaceS3Domain } from '@root/lib/utils/url';

import type { LoggedInUser } from './getCurrentUserAction';

/**
 * @ Function for getting the logged in user
 * @returns The current logged in user or null if there is no user id
 */
export async function getCurrentUser(userId?: string): Promise<LoggedInUser | null> {
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      farcasterUser: true
    }
  });

  if (user?.avatar) {
    user.avatar = replaceS3Domain(user.avatar);
  }

  return user;
}
