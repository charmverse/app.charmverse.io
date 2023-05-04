import { prisma } from '@charmverse/core';
import type { User } from '@charmverse/core/dist/prisma';

import log from 'lib/log';
import { sessionUserRelations } from 'lib/session/config';
import { MissingDataError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { getUserProfile } from './getUser';
import { updateUsedIdentity } from './updateUsedIdentity';

export async function updateUserProfile(userId: string, update: Partial<User>): Promise<LoggedInUser> {
  const { username, identityType, ...updateContent } = update;

  if ((identityType && !username) || (!identityType && username)) {
    throw new MissingDataError(`Username is required along with identity type`);
  } else if (username && identityType) {
    await updateUsedIdentity(userId, {
      identityType,
      displayName: username
    });
  }

  if (Object.keys(updateContent).length > 0) {
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
        path: update.path,
        email: update.email,
        spacesOrder: update.spacesOrder,
        emailNewsletter: update.emailNewsletter,
        emailNotifications: update.emailNotifications
      }
    });
  }

  log.info('Updated user information', { userId, update });

  return getUserProfile('id', userId);
}
