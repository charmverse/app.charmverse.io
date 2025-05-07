import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import type { LoggedInUser } from '@packages/profile/getUser';
import { updateUsedIdentity } from '@packages/users/updateUsedIdentity';
import { InvalidInputError, MissingDataError } from '@packages/utils/errors';

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
