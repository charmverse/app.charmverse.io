import type { Scout } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { replaceS3Domain } from '@root/lib/utils/url';

import { getSession } from './getSession';

export type SessionUser = Pick<Scout, 'id' | 'username' | 'displayName' | 'avatar'>;

export async function getUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  if (session?.adminId) {
    const user = await prisma.scout.findFirst({
      where: {
        id: session.adminId
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true
      }
    });

    if (user?.avatar) {
      user.avatar = replaceS3Domain(user.avatar);
    }
    return user;
  }
  return null;
}
