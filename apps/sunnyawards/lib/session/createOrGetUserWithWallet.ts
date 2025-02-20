import { log } from '@charmverse/core/log';
import type { User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getENSName } from '@packages/blockchain/getENSName';
import { uid } from '@packages/utils/strings';
import { logSignupViaWallet } from '@root/lib/metrics/postToDiscord';
import { isProfilePathAvailable } from '@root/lib/profile/isProfilePathAvailable';
import { sessionUserRelations } from '@root/lib/session/config';
import { prepopulateUserProfile } from '@root/lib/users/prepopulateUserProfile';
import { shortWalletAddress } from '@root/lib/utils/blockchain';
import { v4 } from 'uuid';

import { getUserWalletProfile } from './getUserWalletProfile';

type UserProps = { address: string; id?: string };

export async function createOrGetUserFromWallet({ id = v4(), address }: UserProps): Promise<{
  user: User;
  isNew: boolean;
}> {
  const lowercaseAddress = address.toLowerCase();

  const user = await getUserWalletProfile({ wallet: lowercaseAddress }).catch((error) => null);
  if (user?.claimed === false) {
    let ens: string | null = null;
    try {
      ens = await getENSName(address);
    } catch (error) {
      log.warn('Could not retrieve ENS while creating a user', { error });
    }

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        claimed: true
      }
    });

    try {
      await prepopulateUserProfile(user, ens);
    } catch (error) {
      log.error('Error while prepopulating user profile', { error, userId: user.id });
    }

    if (user.identityType === 'Wallet') {
      logSignupViaWallet();
    }

    return {
      isNew: true,
      user
    };
  } else if (user) {
    return {
      isNew: false,
      user
    };
  }

  // ignore error, it just means user was not found
  let ens: string | null = null;
  try {
    ens = await getENSName(address);
  } catch (error) {
    log.warn('Could not retrieve ENS while creating a user', { error });
  }
  const userPath = shortWalletAddress(address).replace('…', '-');
  const isUserPathAvailable = await isProfilePathAvailable(userPath);

  const newUser = await prisma.user.create({
    data: {
      id,
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
    include: sessionUserRelations
  });

  try {
    await prepopulateUserProfile(newUser, ens);
  } catch (error) {
    log.error('Error while prepopulating user profile', { error, userId: newUser.id });
  }

  return {
    isNew: true,
    user: newUser
  };
}
