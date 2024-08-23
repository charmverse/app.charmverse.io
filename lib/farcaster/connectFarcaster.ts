import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-client';
import { InvalidStateError } from '@root/lib/middleware';
import { sessionUserRelations } from '@root/lib/session/config';
import { getUserProfile } from '@root/lib/users/getUser';
import { DisabledAccountError, ExternalServiceError } from '@root/lib/utils/errors';
import type { LoggedInUser } from '@root/models';

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
      log.warn('Farcaster already connected to another account', {
        fid,
        userId,
        connectedUserId: farcasterUser.userId
      });
      throw new InvalidStateError('Farcaster already connected to another account');
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
