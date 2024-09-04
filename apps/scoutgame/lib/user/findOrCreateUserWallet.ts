import { DisabledAccountError, InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadUrlToS3 } from '@root/lib/aws/uploadToS3Server';
import { getENSDetails, getENSName } from '@root/lib/blockchain/getENSName';
import { isProfilePathAvailable } from '@root/lib/profile/isProfilePathAvailable';
import { shortWalletAddress } from '@root/lib/utils/blockchain';
import { getFilenameWithExtension } from '@root/lib/utils/getFilenameWithExtension';
import { uid } from '@root/lib/utils/strings';
import type { SiweMessage } from 'siwe';
import { v4 } from 'uuid';

import type { LoggedInUser } from '../auth/interfaces';

import { sessionUserRelations } from './config';

export async function findOrCreateUserWallet({
  newUserId,
  walletData
}: {
  walletData: SiweMessage;
  newUserId?: string;
}): Promise<LoggedInUser> {
  const lowercaseAddress = walletData.address.toLowerCase();

  const userWallet = await prisma.userWallet.findFirst({
    where: {
      address: lowercaseAddress
    },
    include: {
      user: {
        include: sessionUserRelations
      }
    }
  });

  const user = userWallet?.user;

  if (user) {
    if (user?.deletedAt) {
      throw new DisabledAccountError();
    }

    return user;
  }

  const ens = await getENSName(lowercaseAddress).catch((error) => {
    log.warn('Could not retrieve ENS while creating a user', { error });
    return null;
  });
  const ensDetails = await getENSDetails(ens).catch((error) => {
    log.warn('Could not retrieve ENS details while creating a user', { error });
  });

  const userId = newUserId || v4();
  const userPath = shortWalletAddress(lowercaseAddress).replace('…', '-');
  const isUserPathAvailable = await isProfilePathAvailable(userPath);

  let avatarUrl = '';
  if (ensDetails?.avatar) {
    const pathInS3 = getUserS3FilePath({ userId, url: getFilenameWithExtension(ensDetails?.avatar) });
    try {
      const { url } = await uploadUrlToS3({ pathInS3, url: ensDetails?.avatar });
      avatarUrl = url;
    } catch (e) {
      log.error('Failed to save avatar', { error: e, pathInS3, url: ensDetails?.avatar, userId });
      throw new InvalidInputError('Failed to save avatar');
    }
  }

  const newUser = await prisma.user.create({
    data: {
      id: userId,
      avatar: avatarUrl,
      identityType: 'Wallet',
      username: ens ?? shortWalletAddress(lowercaseAddress),
      path: isUserPathAvailable ? userPath : uid(),
      wallets: {
        create: {
          address: lowercaseAddress,
          ensname: ens
        }
      }
    },
    include: {
      wallets: true,
      farcasterUser: true
    }
  });

  return newUser;
}
