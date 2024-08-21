import { DataNotFoundError } from '@charmverse/core/errors';
import type { FarcasterUser } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { shortWalletAddress } from 'lib/utils/blockchain';
import { uid } from 'lib/utils/strings';

import { getFarcasterUsers } from './getFarcasterUsers';

export type TypedFarcasterUser = FarcasterUser & {
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

  const farcasterAccount = await getFarcasterUsers({ fids: [fid] }).then((users) => users[0]);

  if (!farcasterAccount) {
    throw new DataNotFoundError(`Farcaster user ${fid} not found`);
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
          pfpUrl: farcasterAccount.pfp_url
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
            pfpUrl: farcasterAccount.pfp_url
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
