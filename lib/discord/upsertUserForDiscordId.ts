import { prisma } from 'db';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';

export async function upsertUserForDiscordId(discordId: string, account?: Partial<DiscordAccount>) {
  const existingDiscordUser = await prisma.discordUser.findFirst({
    where: {
      discordId
    }
  });

  if (existingDiscordUser) {
    return existingDiscordUser.userId;
  }

  // Create new user and discord user in db
  const discordUser = await prisma.discordUser.create({
    data: {
      account: account || {},
      discordId,
      user: {
        create: {
          identityType: 'Discord',
          username: discordId,
          path: null
        }
      }
    }
  });

  return discordUser.userId;
}
