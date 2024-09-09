import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { sessionUserRelations } from '@root/lib/session/config';
import { updateUsedIdentity } from '@root/lib/users/updateUsedIdentity';
import { InvalidInputError, MissingDataError } from '@root/lib/utils/errors';

export type DisconnectDiscordRequest = {
  userId: string;
};

export async function disconnectDiscordAccount({ userId }: DisconnectDiscordRequest): Promise<LoggedInUser> {
  if (!userId) {
    throw new InvalidInputError(`userId required to disconnect Discord account`);
  }

  const accountToDelete = await prisma.discordUser.findUnique({
    where: {
      userId
    },
    include: {
      user: {
        include: sessionUserRelations
      }
    }
  });

  if (!accountToDelete) {
    throw new MissingDataError(`Discord account with not found for user ${userId}`);
  }

  const { user } = accountToDelete;

  await prisma.discordUser.delete({
    where: {
      userId
    }
  });

  return updateUsedIdentity(user.id);
}
