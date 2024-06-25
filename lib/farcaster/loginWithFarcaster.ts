import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { v4 as uuid } from 'uuid';

import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { sessionUserRelations } from 'lib/session/config';
import { postUserCreate } from 'lib/users/postUserCreate';
import { DisabledAccountError, ExternalServiceError } from 'lib/utils/errors';
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
        include: sessionUserRelations
      }
    }
  });

  if (farcasterUser) {
    if (farcasterUser.user.deletedAt) {
      throw new DisabledAccountError();
    }

    trackUserAction('sign_in', { userId: farcasterUser.user.id, identityType: 'Farcaster' });

    return farcasterUser.user;
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
      },
      include: {
        profile: true
      }
    });

    const userId = userWithWallet?.id ?? uuid();

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

    if (userWithWallet) {
      const updatedUser = await prisma.user.update({
        where: {
          id: userWithWallet.id
        },
        data: {
          profile: {
            upsert: {
              create: {
                description: bio || '',
                social: {
                  farcasterUrl: `https://warpcast.com/${username}`
                }
              },
              update: {
                description: userWithWallet.profile?.description || bio || '',
                locale: userWithWallet.profile?.locale,
                timezone: userWithWallet.profile?.timezone,
                social: {
                  farcasterUrl: `https://warpcast.com/${username}`
                }
              }
            }
          },
          farcasterUser: {
            create: {
              account: { username, displayName, bio, pfpUrl },
              fid
            }
          }
        },
        include: sessionUserRelations
      });

      trackUserAction('sign_in', { userId: userWithWallet.id, identityType: 'Farcaster' });

      return updatedUser;
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
