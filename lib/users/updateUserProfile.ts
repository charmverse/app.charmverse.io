import { log } from '@charmverse/core/log';
import type { User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { sessionUserRelations } from '@root/lib/session/config';
import { MissingDataError } from '@root/lib/utils/errors';

import { getUserProfile } from '../profile/getUser';

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
        publishToLensDefault: update.publishToLensDefault,
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

  log.debug('Updated user information', { userId });

  return getUserProfile('id', userId);
}
