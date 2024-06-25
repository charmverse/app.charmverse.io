import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { v4 } from 'uuid';

import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { sessionUserRelations } from 'lib/session/config';
import { getUserProfile } from 'lib/users/getUser';
import { postUserCreate } from 'lib/users/postUserCreate';
import { DataNotFoundError, DisabledAccountError, ExternalServiceError } from 'lib/utils/errors';
import { uid } from 'lib/utils/strings';
import type { LoggedInUser } from 'models';

export async function loginWithFarcaster({
  fid,
  pfpUrl,
  username,
  displayName,
  bio,
  verifications = [],
  signupAnalytics = {}
}: FarcasterBody & { signupAnalytics?: Partial<SignupAnalytics> }): Promise<LoggedInUser> {
  if (!fid || !username) {
    throw new ExternalServiceError('Farcaster id missing');
  }

  const farcasterUser = await prisma.farcasterUser.findUnique({
    where: {
      fid
    },
    include: {
      user: {
        select: {
          id: true,
          deletedAt: true,
          claimed: true
        }
      }
    }
  });

  if (farcasterUser) {
    if (farcasterUser.user.deletedAt) {
      throw new DisabledAccountError();
    }

    if (!farcasterUser.user.claimed) {
      await prisma.user.update({
        where: {
          id: farcasterUser.userId
        },
        data: {
          claimed: true
        }
      });
    }

    trackUserAction('sign_in', { userId: farcasterUser.user.id, identityType: 'Farcaster' });

    return getUserProfile('id', farcasterUser.userId);
  } else {
    const userWithWallet = await prisma.user.findFirst({
      where: {
        wallets: {
          some: {
            address: {
              in: verifications
            }
          }
        }
      }
    });

    if (userWithWallet) {
      throw new DataNotFoundError(
        'Your wallet address associated with Farcaster has already an user account. Please login with your wallet and add farcaster as a second login method.'
      );
    }

    const userId = v4();

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

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        username,
        identityType: 'Farcaster',
        avatar,
        farcasterUser: {
          create: {
            account: { username, displayName, bio, pfpUrl },
            fid
          }
        },
        path: uid(),
        profile: {
          create: {
            ...(bio && { description: bio || '' }),
            social: {
              farcasterUrl: `https://warpcast.com/${username}`
            }
          }
        }
      },
      include: sessionUserRelations
    });

    postUserCreate({ user: newUser, identityType: 'Farcaster', signupAnalytics });

    return newUser;
  }
}
