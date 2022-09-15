import { prisma } from 'db';
import { shortenHex } from 'lib/utilities/strings';
import { IDENTITY_TYPES, LoggedInUser } from 'models';
import getENSName from 'lib/blockchain/getENSName';
import { sessionUserRelations } from 'lib/session/config';

export async function createUserFromWallet (address: string): Promise<LoggedInUser> {
  const user = await prisma.user.findFirst({
    where: {
      addresses: {
        has: address
      }
    },
    include: sessionUserRelations
  });

  if (user) {
    return user;
  }
  else {
    const ens: string | null = await getENSName(address);

    const newUser = await prisma.user.create({
      data: {
        addresses: [address],
        identityType: IDENTITY_TYPES[0],
        username: ens || shortenHex(address)
      },
      include: sessionUserRelations
    });

    return newUser;

  }
}
