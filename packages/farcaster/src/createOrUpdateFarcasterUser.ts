import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadUrlToS3 } from '@packages/aws/uploadToS3Server';
import { log } from '@packages/core/log';
import { DisabledAccountError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';
import { v4 as uuid } from 'uuid';

export async function createOrUpdateFarcasterUser({
  bio,
  displayName,
  fid,
  pfpUrl,
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
  newUserId?: string;
}): Promise<{
  userId: string;
  created: boolean;
}> {
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

    return {
      userId: farcasterUser.userId,
      created: false
    };
  }

  const userWithWallet = await prisma.user.findFirst({
    where: {
      wallets: {
        some: {
          address: {
            in: verifications
          }
        }
      },
      farcasterUser: {
        is: null
      }
    },
    include: {
      profile: true
    }
  });

  if (userWithWallet) {
    await prisma.user.update({
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
      }
    });

    return {
      userId: userWithWallet.id,
      created: false
    };
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
    }
  });

  return {
    userId: newUser.id,
    created: true
  };
}
