import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { getENSName } from 'lib/blockchain/getENSName';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { logSignupViaWallet } from 'lib/metrics/postToDiscord';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { sessionUserRelations } from 'lib/session/config';
import { postUserCreate } from 'lib/users/postUserCreate';
import { shortWalletAddress } from 'lib/utils/blockchain';
import { uid } from 'lib/utils/strings';
import type { LoggedInUser } from 'models';

import { getUserProfile } from './getUser';
import { prepopulateUserProfile } from './prepopulateUserProfile';

type UserProps = { address: string; email?: string; id?: string; avatar?: string; skipTracking?: boolean };

export async function createOrGetUserFromWallet(
  { id = v4(), address, email, avatar, skipTracking }: UserProps,
  signupAnalytics: Partial<SignupAnalytics> = {}
): Promise<{
  user: LoggedInUser;
  isNew: boolean;
}> {
  const lowercaseAddress = address.toLowerCase();

  try {
    const user = await getUserProfile('addresses', lowercaseAddress);
    if (user.claimed === false) {
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
          claimed: true,
          email,
          avatar
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

      if (!skipTracking && user.identityType) {
        postUserCreate({ user, identityType: user.identityType, signupAnalytics });
      }

      return {
        isNew: true,
        user
      };
    } else {
      return {
        isNew: false,
        user
      };
    }
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

    if (newUser.identityType === 'Wallet') {
      logSignupViaWallet();
    }

    if (!skipTracking && newUser.identityType) {
      postUserCreate({ user: newUser, identityType: newUser.identityType, signupAnalytics });
    }

    return {
      isNew: true,
      user: newUser
    };
  }
}

export async function createUserFromWallet(
  { id = v4(), address, email, avatar, skipTracking }: UserProps,
  signupAnalytics: Partial<SignupAnalytics> = {}
): Promise<LoggedInUser> {
  const { user } = await createOrGetUserFromWallet({ id, address, email, avatar, skipTracking }, signupAnalytics);
  return user;
}
