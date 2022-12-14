import type { User } from '@prisma/client';

import updated from 'components/common/CharmEditor/components/paragraph';
import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import { InsecureOperationError, MissingDataError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { getUserProfile } from './getUser';

export async function updateUserProfile(userId: string, update: Partial<User>): Promise<LoggedInUser> {
  const { username, identityType } = update;

  let avatar = update.avatar;

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
        name: username
      }
    });

    if (!googleAccount) {
      throw new InsecureOperationError(
        `Cannot switch to Google Account ${username} for user ${userId} as it is not registered`
      );
    }

    avatar = googleAccount.avatarUrl;
  }
  await prisma.user.update({
    where: {
      id: userId
    },
    include: sessionUserRelations,
    data: {
      avatar,
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
