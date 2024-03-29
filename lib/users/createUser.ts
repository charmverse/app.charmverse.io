import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { getENSName } from 'lib/blockchain/getENSName';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { sessionUserRelations } from 'lib/session/config';
import { postUserCreate } from 'lib/users/postUserCreate';
import { shortWalletAddress, randomETHWalletAddress } from 'lib/utils/blockchain';
import { uid } from 'lib/utils/strings';
import type { LoggedInUser } from 'models';

import { getUserProfile } from './getUser';
import { prepopulateUserProfile } from './prepopulateUserProfile';

type UserProps = { address?: string; email?: string; id?: string; avatar?: string; skipTracking?: boolean };

export async function createUserFromWallet(
  { id = v4(), address = randomETHWalletAddress(), email, avatar, skipTracking }: UserProps = {},
  signupAnalytics: Partial<SignupAnalytics> = {}
): Promise<LoggedInUser> {
  const lowercaseAddress = address.toLowerCase();

  try {
    const user = await getUserProfile('addresses', lowercaseAddress);
    return user;
  } catch (_) {
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
        avatar,
        email,
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

    if (!skipTracking) {
      postUserCreate({ user: newUser, identityType: 'Wallet', signupAnalytics });
    }

    return newUser;
  }
}
