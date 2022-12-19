import type { Prisma } from '@prisma/client';
import { Wallet } from 'ethers';
import { v4 } from 'uuid';

import { prisma } from 'db';
import getENSName from 'lib/blockchain/getENSName';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { sessionUserRelations } from 'lib/session/config';
import { shortenHex } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

export async function createUserFromWallet(
  { id = v4(), address = Wallet.createRandom().address, email }: { address?: string; email?: string; id?: string } = {},
  signupAnalytics: Partial<SignupAnalytics> = {}
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
  } else {
    const ens: string | null = await getENSName(address);
    const username = ens || shortenHex(address);
    const userPath = username.replace('…', '-');
    const isUserPathAvailable = await isProfilePathAvailable(userPath, undefined, prisma);

    const newUser = await prisma.user.create({
      data: {
        email,
        id,
        identityType: 'Wallet',
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

    updateTrackUserProfile(newUser, prisma);
    trackUserAction('sign_up', { userId: newUser.id, identityType: 'Wallet', ...signupAnalytics });

    return newUser;
  }
}
