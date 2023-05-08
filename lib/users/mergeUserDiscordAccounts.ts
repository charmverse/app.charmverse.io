import { prisma } from '@charmverse/core';
import type { DiscordUser } from '@charmverse/core/prisma';

import { softDeleteUserWithoutConnectableIdentities } from 'lib/users/softDeleteUserWithoutConnectableIdentities';

export async function mergeUserDiscordAccounts({
  currentUserId,
  toDeleteUserId,
  discordId
}: {
  currentUserId: string;
  toDeleteUserId: string;
  discordId: string;
}): Promise<DiscordUser> {
  const discordUser = await prisma.discordUser.update({
    where: {
      discordId
    },
    data: {
      user: {
        connect: {
          id: currentUserId
        }
      }
    }
  });

  await softDeleteUserWithoutConnectableIdentities({
    userId: toDeleteUserId,
    newUserId: currentUserId
  });

  return discordUser;
}
