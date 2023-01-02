import type { DiscordUser } from '@prisma/client';

import { prisma } from 'db';
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
