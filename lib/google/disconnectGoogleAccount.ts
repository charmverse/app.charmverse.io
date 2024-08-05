import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@root/lib/session/config';
import { updateUsedIdentity } from '@root/lib/users/updateUsedIdentity';
import { InvalidInputError, MissingDataError } from '@root/lib/utils/errors';
import type { LoggedInUser } from '@root/models';

export type DisconnectGoogleAccountRequest = {
  userId: string;
  googleAccountEmail: string;
};

export async function disconnectGoogleAccount({
  googleAccountEmail,
  userId
}: DisconnectGoogleAccountRequest): Promise<LoggedInUser> {
  if (!googleAccountEmail || !userId) {
    throw new InvalidInputError(`Email and userId required to disconnect Google account`);
  }

  const accountToDelete = await prisma.googleAccount.findFirst({
    where: {
      userId,
      email: googleAccountEmail
    },
    include: {
      user: {
        include: sessionUserRelations
      }
    }
  });

  if (!accountToDelete) {
    throw new MissingDataError(`Google account with email ${googleAccountEmail} not found for user ${userId}`);
  }

  const { user } = accountToDelete;

  await prisma.googleAccount.delete({
    where: {
      id: accountToDelete.id
    }
  });

  return updateUsedIdentity(user.id);
}
