import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import type { LoggedInUser } from 'models/User';

import { uploadUrlToS3, getUserS3FilePath } from '../aws/uploadToS3Server';
import type { SignupAnalytics } from '../metrics/mixpanel/interfaces/UserEvent';
import { trackOpSpaceClickSigninEvent } from '../metrics/mixpanel/trackOpSpaceSigninEvent';
import { trackUserAction } from '../metrics/mixpanel/trackUserAction';
import { sessionUserRelations } from '../session/config';
import { getUserProfile } from '../users/getUser';
import { postUserCreate } from '../users/postUserCreate';
import { DisabledAccountError } from '../utils/errors';
import { uid } from '../utils/strings';

export async function createOrUpdateFarcasterUser({
  bio,
  displayName,
  fid,
  pfpUrl,
  signupAnalytics = {},
  username,
  verifications,
  newUserId
}: {
  fid: number;
  username: string;
  displayName?: string;
  bio?: string;
  pfpUrl?: string;
  verifications: string[];
  signupAnalytics?: Partial<SignupAnalytics>;
  newUserId?: string;
}): Promise<LoggedInUser> {
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

    await trackOpSpaceClickSigninEvent({
      userId: farcasterUser.user.id,
      identityType: 'Farcaster'
    });

    return getUserProfile('id', farcasterUser.userId);
  }
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
            account: { username, displayName, bio, pfpUrl, fid },
            fid
          }
        }
      },
      include: sessionUserRelations
    });

    trackUserAction('sign_in', { userId: userWithWallet.id, identityType: 'Farcaster' });

    await trackOpSpaceClickSigninEvent({
      userId: userWithWallet.id,
      identityType: 'Farcaster'
    });

    return updatedUser;
  }

  const userId = newUserId || uuid();

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
