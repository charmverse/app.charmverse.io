import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import type { LoggedInUser } from 'models';

import { countConnectableIdentities } from './countConnectableIdentities';
import { getUserProfile } from './getUser';

export async function softDeleteUserWithoutConnectableIdentities(
  userOrUserId: string | LoggedInUser
): Promise<LoggedInUser> {
  const user = typeof userOrUserId === 'string' ? await getUserProfile('id', userOrUserId) : userOrUserId;

  const connectableIdentities = await countConnectableIdentities(user);

  // No identities left, mark user as deleted
  if (connectableIdentities === 0) {
    return prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        deletedAt: new Date()
      },
      include: sessionUserRelations
    });
  }

  return user;
}
