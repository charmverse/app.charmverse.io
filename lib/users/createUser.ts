import { Wallet } from 'ethers';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { getENSName } from 'lib/blockchain/getENSName';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { sessionUserRelations } from 'lib/session/config';
import { shortWalletAddress } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import { getUserProfile } from './getUser';
import { prepopulateUserProfile } from './prepopulateUserProfile';

type UserProps = { address?: string; email?: string; id?: string; avatar?: string };

export async function createUserFromWallet(
  { id = v4(), address = Wallet.createRandom().address, email, avatar }: UserProps = {},
  signupAnalytics: Partial<SignupAnalytics> = {}
): Promise<LoggedInUser> {
  const lowercaseAddress = address.toLowerCase();

  try {
    const user = await getUserProfile('addresses', lowercaseAddress);
    return user;
  } catch (error) {
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
        path: isUserPathAvailable ? userPath : null,
        wallets: {
          create: {
            address: lowercaseAddress,
            ensname: ens
          }
        }
      },
      include: sessionUserRelations
    });

    await prepopulateUserProfile(newUser, ens);

    updateTrackUserProfile(newUser, prisma);
    trackUserAction('sign_up', { userId: newUser.id, identityType: 'Wallet', ...signupAnalytics });

    return newUser;
  }
}
