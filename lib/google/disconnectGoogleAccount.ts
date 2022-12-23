import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import { softDeleteUserWithoutConnectableIdentities } from 'lib/users/softDeleteUserWithoutConnectableIdentities';
import { updateUsedIdentity } from 'lib/users/updateUsedIdentity';
import { InvalidInputError, MissingDataError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

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

  await updateUsedIdentity(user.id);

  return softDeleteUserWithoutConnectableIdentities(user.id);
}
