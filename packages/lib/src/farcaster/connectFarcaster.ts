import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-client';
import { log } from '@packages/core/log';
import { InvalidStateError } from '@packages/nextjs/errors';
import { sessionUserRelations } from '@packages/profile/constants';
import { getUserProfile } from '@packages/profile/getUser';
import type { LoggedInUser } from '@packages/profile/getUser';
import { softDeleteUserWithoutConnectableIdentities } from '@packages/users/softDeleteUserWithoutConnectableIdentities';
import { updateUsedIdentity } from '@packages/users/updateUsedIdentity';
import { DisabledAccountError, ExternalServiceError } from '@packages/utils/errors';

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
