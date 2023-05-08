import { prisma } from '@charmverse/core';
import { log } from '@charmverse/core/log';
import { Wallet } from 'ethers';
import { v4 } from 'uuid';

import { getENSName } from 'lib/blockchain/getENSName';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { sessionUserRelations } from 'lib/session/config';
import { shortWalletAddress, uid } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import { getUserProfile } from './getUser';
import { prepopulateUserProfile } from './prepopulateUserProfile';

type UserProps = { address?: string; email?: string; id?: string; avatar?: string; skipTracking?: boolean };

export async function createUserFromWallet(
  { id = v4(), address = Wallet.createRandom().address, email, avatar, skipTracking }: UserProps = {},
  signupAnalytics: Partial<SignupAnalytics> = {}
): Promise<LoggedInUser> {
  const lowercaseAddress = address.toLowerCase();

  try {
    const user = await getUserProfile('addresses', lowercaseAddress);
    return user;
  } catch (_) {
    // ignore error, it just means user was not found
    const ens: string | null = await getENSName(address);
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
      updateTrackUserProfile(newUser, prisma);
      trackUserAction('sign_up', { userId: newUser.id, identityType: 'Wallet', ...signupAnalytics });
    }

    return newUser;
  }
}
