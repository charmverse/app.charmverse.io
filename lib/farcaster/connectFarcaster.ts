import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-client';
import { InvalidStateError } from '@root/lib/middleware';
import { getUserProfile } from '@root/lib/profile/getUser';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { sessionUserRelations } from '@root/lib/session/config';
import { softDeleteUserWithoutConnectableIdentities } from '@root/lib/users/softDeleteUserWithoutConnectableIdentities';
import { updateUsedIdentity } from '@root/lib/users/updateUsedIdentity';
import { DisabledAccountError, ExternalServiceError } from '@root/lib/utils/errors';

export async function connectFarcaster({
  fid,
  pfpUrl,
  username,
  displayName,
  bio,
  userId
}: FarcasterBody & { userId: string }): Promise<LoggedInUser> {
  if (!fid || !username) {
    throw new ExternalServiceError('Farcaster id missing');
  }

  const farcasterUser = await prisma.farcasterUser.findUnique({
    where: {
      fid
    },
    include: {
      user: {
        include: sessionUserRelations
      }
    }
  });

  if (farcasterUser) {
    if (farcasterUser.user.deletedAt) {
      throw new DisabledAccountError();
    }

    if (farcasterUser.userId !== userId) {
      await prisma.$transaction(async (tx) => {
        await updateUsedIdentity(farcasterUser.userId, undefined, tx);
        await softDeleteUserWithoutConnectableIdentities({ userId: farcasterUser.userId, newUserId: userId, tx });
        await tx.farcasterUser.update({
          where: {
            fid: farcasterUser.fid
          },
          data: {
            userId
          }
        });
        log.warn('Connecting Farcaster identity to a new account', {
          fid,
          userId,
          connectedUserId: farcasterUser.userId
        });
      });
      return getUserProfile('id', userId);
    }

    return farcasterUser.user;
  }

  await prisma.farcasterUser.create({
    data: {
      account: { username, displayName, bio, pfpUrl },
      fid,
      userId
    }
  });

  return getUserProfile('id', userId);
}
