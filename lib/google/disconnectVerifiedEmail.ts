import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import type { LoggedInUser } from '@packages/profile/getUser';
import { updateUsedIdentity } from '@packages/users/updateUsedIdentity';
import { InvalidInputError, MissingDataError } from '@packages/utils/errors';

export type EmailAccountDisconnect = {
  email: string;
  userId: string;
};

export async function disconnectVerifiedEmail({ email, userId }: EmailAccountDisconnect): Promise<LoggedInUser> {
  if (!email || !userId) {
    throw new InvalidInputError(`Email and userId required to disconnect Google account`);
  }

  const accountToDelete = await prisma.verifiedEmail.findFirst({
    where: {
      userId,
      email
    },
    include: {
      user: {
        include: sessionUserRelations
      }
    }
  });

  if (!accountToDelete) {
    throw new MissingDataError(`Verified email ${email} not found for user ${userId}`);
  }

  const { user } = accountToDelete;

  await prisma.verifiedEmail.delete({
    where: {
      id: accountToDelete.id
    }
  });

  return updateUsedIdentity(user.id);
}
