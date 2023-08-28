import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { countConnectableIdentities } from './countConnectableIdentities';
import { getUserProfile } from './getUser';

export async function softDeleteUserWithoutConnectableIdentities({
  userId,
  newUserId,
  tx = prisma
}: {
  userId: string;
  newUserId: string;
  tx?: Prisma.TransactionClient;
}) {
  const user = await getUserProfile('id', userId, tx);

  const connectableIdentities = countConnectableIdentities(user);

  // No identities left, mark user as deleted
  if (connectableIdentities === 0) {
    log.warn(`Soft deleting user: ${user.id} with no connectable identities`);
    return tx.user.update({
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
