import { v4 } from 'uuid';

import { prisma } from 'db';
import getENSName from 'lib/blockchain/getENSName';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvents';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { sessionUserRelations } from 'lib/session/config';
import { shortenHex } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';
import { IDENTITY_TYPES } from 'models';

export async function createUserFromWallet (
  address: string,
  signupAnalytics: Partial<SignupAnalytics> = {},
  // An ID set by analytics tools to have pre signup user journey
  preExistingId: string = v4()
): Promise<LoggedInUser> {

  const lowercaseAddress = address.toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      wallets: {
        some: {
          address: lowercaseAddress
        }
      }
    },
    include: sessionUserRelations
  });

  if (user) {
    return user;
  }
  else {
    const ens: string | null = await getENSName(address);
    const username = ens || shortenHex(address);
    const userPath = username.replace('…', '-');
    const isUserPathAvailable = await isProfilePathAvailable(userPath);

    const newUser = await prisma.user.create({
      data: {
        id: preExistingId,
        identityType: IDENTITY_TYPES[0],
        username,
        path: isUserPathAvailable ? userPath : null,
        wallets: {
          create: {
            address: lowercaseAddress
          }
        }
      },
      include: sessionUserRelations
    });

    updateTrackUserProfile(newUser);
    trackUserAction('sign_up', { userId: newUser.id, identityType: 'Wallet', ...signupAnalytics });

    return newUser;

  }
}
