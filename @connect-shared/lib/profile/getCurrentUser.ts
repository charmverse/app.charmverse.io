import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { replaceS3Domain } from '@root/lib/utils/url';

import { getSession } from '../session/getSession';

import type { LoggedInUser } from './getCurrentUserAction';

/**
 * @ Function for getting the current logged in user
 * @ Invalidates the session if the user is not found in the database
 * @returns The current logged in user or null if there is no user
 */
export async function getCurrentUser(): Promise<LoggedInUser | null> {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId
    },
    include: {
      farcasterUser: true
    }
  });

  // Handle a bad session user id
  if (!user) {
    session.destroy();
    log.warn('User has a session that is not found in the db', { userId });
    return null;
  }

  if (user.avatar) {
    user.avatar = replaceS3Domain(user.avatar);
  }

  return user;
}
