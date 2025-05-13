import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { FarcasterUser } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { uploadUrlToS3, getUserS3FilePath } from '@packages/aws/uploadToS3Server';
import { isProfilePathAvailable } from '@packages/profile/isProfilePathAvailable';
import { shortWalletAddress } from '@packages/utils/blockchain';
import { uid } from '@packages/utils/strings';
import { v4 as uuid } from 'uuid';

import { getFarcasterUsers } from './getFarcasterUsers';

export type TypedFarcasterUser = Omit<FarcasterUser, 'account'> & {
  account: {
    username: string;
    displayName: string;
    bio: string;
    pfpUrl: string;
  };
};

export async function ensureFarcasterUserExists({ fid }: { fid: number }): Promise<TypedFarcasterUser> {
  const existingFarcasterUser = await prisma.farcasterUser.findUnique({
    where: {
      fid
    }
  });

  if (existingFarcasterUser) {
    return existingFarcasterUser as TypedFarcasterUser;
  }

  const farcasterAccount = await getFarcasterUsers({ fids: [fid] }).then((users) => {
    return users[0];
  });

  if (!farcasterAccount) {
    throw new DataNotFoundError(`Farcaster user fid: ${fid} not found`);
  }

  const existingUserAccount = await prisma.user.findFirst({
    where: {
      wallets: {
        some: {
          address: {
            in: [farcasterAccount.custody_address, ...(farcasterAccount.verified_addresses?.eth_addresses || [])]
          }
        }
      }
    }
  });

  const userId = existingUserAccount?.id || uuid();

  let avatar: string | null = farcasterAccount.pfp_url || '';

  if (farcasterAccount.pfp_url) {
    try {
      ({ url: avatar } = await uploadUrlToS3({
        pathInS3: getUserS3FilePath({ userId, url: farcasterAccount.pfp_url }),
        url: farcasterAccount.pfp_url
      }));
    } catch (error) {
      log.warn('Error while uploading avatar to S3', error);
    }
  }

  if (existingUserAccount) {
    const createdAccount = await prisma.farcasterUser.create({
      data: {
        fid,
        user: {
          connect: {
            id: existingUserAccount.id
          }
        },
        account: {
          username: farcasterAccount.username,
          displayName: farcasterAccount.display_name,
          bio: farcasterAccount.profile.bio.text,
          pfpUrl: avatar
        }
      }
    });

    return createdAccount as TypedFarcasterUser;
  }

  const userPath = shortWalletAddress(farcasterAccount.custody_address).replace('…', '-');
  const isUserPathAvailable = await isProfilePathAvailable(userPath);

  const createdUser = await prisma.user.create({
    data: {
      username: farcasterAccount.username,
      identityType: 'Farcaster',
      path: isUserPathAvailable ? userPath : uid(),
      claimed: false,
      avatar: farcasterAccount.pfp_url,
      farcasterUser: {
        create: {
          fid,
          account: {
            username: farcasterAccount.username,
            displayName: farcasterAccount.display_name,
            bio: farcasterAccount.profile.bio.text,
            pfpUrl: avatar
          }
        }
      }
    },
    select: {
      farcasterUser: true
    }
  });

  return createdUser.farcasterUser as TypedFarcasterUser;
}
