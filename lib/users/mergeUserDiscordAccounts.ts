import type { DiscordUser } from '@prisma/client';

import { prisma } from 'db';

export async function mergeUserDiscordAccounts ({ currentUserId, toDeleteUserId, discordId }: {
  currentUserId: string;
  toDeleteUserId: string;
  discordId: string;
}): Promise<DiscordUser> {

  const [discordUser] = await prisma.$transaction([
    prisma.discordUser.update({
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
    }),
    prisma.user.update({
      where: {
        id: toDeleteUserId
      },
      data: {
        // Soft delete user
        deletedAt: new Date(),
        // Update their name for ref in DB
        username: `Replaced with user id: ${currentUserId}`
      }
    })
  ]);

  return discordUser;
}

