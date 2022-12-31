import { prisma } from 'db';
import log from 'lib/log';

import { countConnectableIdentities } from './countConnectableIdentities';
import { getUserProfile } from './getUser';

export async function softDeleteUserWithoutConnectableIdentities({
  userId,
  newUserId
}: {
  userId: string;
  newUserId: string;
}) {
  const user = await getUserProfile('id', userId);

  const connectableIdentities = await countConnectableIdentities(user);

  // No identities left, mark user as deleted
  if (connectableIdentities === 0) {
    log.warn(`Soft deleting user: ${user.id} with no connectable identities`);
    return prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        deletedAt: new Date(),
        username: `Replaced with user id: ${newUserId}`
      }
    });
  }
}
