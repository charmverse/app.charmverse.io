import { prisma } from 'db';
import { IDENTITY_TYPES } from 'models';

export async function upsertUserForDiscordId(discordId: string) {
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
      account: {},
      discordId,
      user: {
        create: {
          identityType: IDENTITY_TYPES[1],
          username: discordId,
          path: null
        }
      }
    }
  });

  return discordUser.userId;
}
