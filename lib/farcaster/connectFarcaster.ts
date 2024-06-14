import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';

import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { sessionUserRelations } from 'lib/session/config';
import { getUserProfile } from 'lib/users/getUser';
import { DisabledAccountError, ExternalServiceError } from 'lib/utils/errors';
import type { LoggedInUser } from 'models';

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

    return farcasterUser.user;
  }

  let avatar: string | null = null;
  if (pfpUrl) {
    try {
      ({ url: avatar } = await uploadUrlToS3({
        pathInS3: getUserS3FilePath({ userId, url: pfpUrl }),
        url: pfpUrl
      }));
    } catch (error) {
      log.warn('Error while uploading avatar to S3', error);
    }
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
