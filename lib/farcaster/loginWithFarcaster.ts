import { log } from '@charmverse/core/log';
import type { FarcasterUser } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-client';
import { createAppClient, verifySignInMessage, viemConnector } from '@farcaster/auth-client';
import { getChainById } from '@root/connectors/chains';
import { getUserS3FilePath, uploadUrlToS3 } from '@root/lib/aws/uploadToS3Server';
import type { SignupAnalytics } from '@root/lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from '@root/lib/metrics/mixpanel/trackUserAction';
import { InvalidStateError } from '@root/lib/middleware';
import { sessionUserRelations } from '@root/lib/session/config';
import { getUserProfile } from '@root/lib/users/getUser';
import { postUserCreate } from '@root/lib/users/postUserCreate';
import { DisabledAccountError, InvalidInputError } from '@root/lib/utils/errors';
import { uid } from '@root/lib/utils/strings';
import type { LoggedInUser } from '@root/models';
import { v4 as uuid } from 'uuid';
import { optimism } from 'viem/chains';

import { trackOpSpaceClickSigninEvent } from '../metrics/mixpanel/trackOpSpaceSigninEvent';

const appClient = createAppClient({
  ethereum: viemConnector({
    rpcUrl: getChainById(optimism.id)!.rpcUrls[0]
  })
});

export type FarcasterProfileInfo = {
  fid: number;
  username?: string;
  displayName?: string;
  bio?: string;
  pfpUrl?: string;
};

export type FarcasterUserWithProfile = Omit<FarcasterUser, 'account'> & {
  account: FarcasterProfileInfo;
};

export type LoginWithFarcasterParams = FarcasterBody &
  Required<Pick<FarcasterBody, 'nonce' | 'message' | 'signature'>> & {
    signupAnalytics?: Partial<SignupAnalytics>;
    nonce: string;
    message: string;
    signature: string;
  };

export async function loginWithFarcaster({
  fid,
  pfpUrl,
  username,
  displayName,
  bio,
  verifications = [],
  signupAnalytics = {},
  nonce,
  message,
  signature
}: LoginWithFarcasterParams): Promise<LoggedInUser> {
  if (!fid || !username) {
    throw new InvalidInputError('Farcaster id missing');
  }

  const { success, error: farcasterLoginError } = await verifySignInMessage(appClient, {
    nonce,
    message,
    signature,
    domain: 'charmverse.io'
  });

  if (farcasterLoginError) {
    throw new InvalidStateError(farcasterLoginError.message || 'Invalid signature');
  } else if (!success) {
    throw new InvalidStateError('Invalid signature');
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

  const userId = uuid();

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
