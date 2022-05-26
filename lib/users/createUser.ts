import { prisma } from 'db';
import { IDENTITY_TYPES, LoggedInUser } from 'models';

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
    const newUser = await prisma.user.create({
      data: {
        addresses: [address],
        identityType: IDENTITY_TYPES[0]
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
