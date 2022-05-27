import { prisma } from 'db';
import { shortenHex } from 'lib/utilities/strings';
import { IDENTITY_TYPES, LoggedInUser } from 'models';
import getENSName from 'lib/blockchain/getENSName';

export async function createUserFromWallet (address: string): Promise<LoggedInUser> {
  const user = await prisma.user.findFirst({
    where: {
      addresses: {
        has: address
      }
    },
    include: {
      favorites: true,
      spaceRoles: {
        include: {
          spaceRoleToRole: {
            include: {
              role: true
            }
          }
        }
      },
      discordUser: true,
      telegramUser: true
    }
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
      include: {
        favorites: true,
        spaceRoles: {
          include: {
            spaceRoleToRole: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    return newUser;

  }
}
