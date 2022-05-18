import { LoggedInUser } from 'models';
import { User, Prisma } from '@prisma/client';
import { prisma } from 'db';

type UserIdentifiers = Extract<keyof User, 'id' | 'addresses'>

export async function getUserProfile (key: UserIdentifiers, value: string): Promise<LoggedInUser> {

  const query: Prisma.UserWhereInput = {};

  if (!value) {
    throw {
      error: 'Invalid query'
    };
  }

  if (key === 'addresses') {
    query.addresses = {
      has: value
    };
  }
  else {
    query.id = value;
  }

  const profile = await prisma.user.findFirst({
    where: query,
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

  if (!profile) {
    throw {
      error: 'User not found'
    };
  }
  return profile;
}

