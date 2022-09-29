import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { prisma } from 'db';
import { shortenHex } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';
import { IDENTITY_TYPES } from 'models';
import getENSName from 'lib/blockchain/getENSName';
import { sessionUserRelations } from 'lib/session/config';

export async function createUserFromWallet (address: string): Promise<LoggedInUser> {
  const user = await prisma.user.findFirst({
    where: {
      wallets: {
        some: {
          address
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
        identityType: IDENTITY_TYPES[0],
        username,
        path: isUserPathAvailable ? userPath : null,
        wallets: {
          create: {
            address
          }
        }
      },
      include: sessionUserRelations
    });

    return newUser;

  }
}
