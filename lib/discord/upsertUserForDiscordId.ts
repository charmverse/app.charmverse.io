import { prisma } from 'db';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import randomName from 'lib/utilities/randomName';
import { uid } from 'lib/utilities/strings';

type UserProps = { discordId: string; avatar?: string; username?: string; account?: Partial<DiscordAccount> };

export async function upsertUserForDiscordId({ discordId, account, username, avatar }: UserProps) {
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
          avatar,
          identityType: 'Discord',
          username: username || randomName(),
          path: uid()
        }
      }
    }
  });

  return discordUser.userId;
}
