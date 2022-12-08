import type { User } from '@prisma/client';

import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import { InsecureOperationError, MissingDataError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { getUserProfile } from './getUser';

export async function updateUserProfile(userId: string, update: Partial<User>): Promise<LoggedInUser> {
  const { username, identityType } = update;

  if ((identityType && !username) || (!identityType && username)) {
    throw new MissingDataError(`Username is required along with identity type`);
  }

  if (identityType === 'UnstoppableDomain') {
    const domain = await prisma.unstoppableDomain.findFirst({
      where: {
        userId,
        domain: username
      }
    });

    if (!domain) {
      throw new InsecureOperationError(
        `Cannot switch to Unstoppable Domain ${username} for user ${userId} as it is not registered`
      );
    }
  } else if (identityType === 'Google') {
    const googleAccount = await prisma.googleAccount.findFirst({
      where: {
        userId,
        email: username
      }
    });

    if (!googleAccount) {
      throw new InsecureOperationError(
        `Cannot switch to Google Account ${username} for user ${userId} as it is not registered`
      );
    }
  }
  await prisma.user.update({
    where: {
      id: userId
    },
    include: sessionUserRelations,
    data: {
      avatar: update.avatar,
      avatarChain: update.avatarChain,
      avatarContract: update.avatarContract,
      avatarTokenId: update.avatarTokenId,
      identityType: update.identityType,
      username: update.username,
      path: update.path
    }
  });

  return getUserProfile('id', userId);
}
