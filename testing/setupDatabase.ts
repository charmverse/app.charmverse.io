import { createUserFromWallet } from 'lib/users/createUser';
import { User, Space } from '@prisma/client';
import { LoggedInUser } from 'models';
import { prisma } from 'db';
import { v4 } from 'uuid';

/**
 * Simple utility to provide a user and space object inside test code
 * @param walletAddress
 * @returns
 */
export async function generateUserAndSpace (walletAddress: string = '0x0bdCC3f24822AD36CE4Fc1fa8Fe9FD6B235f0078'): Promise<{
  user: LoggedInUser,
  space: Space
}> {
  const user = await createUserFromWallet(walletAddress);

  if (user.spaceRoles.length > 0) {

    const existingSpace = await prisma.space.findUnique({ where: { id: user.spaceRoles[0].spaceId } });

    if (existingSpace) {
      return {
        user,
        space: existingSpace
      };
    }
  }

  const newSpace = await prisma.space.create({
    data: {
      name: 'Example space',
      domain: v4(),
      author: {
        connect: {
          id: user.id
        }
      },
      updatedBy: user.id,
      updatedAt: (new Date()).toISOString(),
      spaceRoles: {
        create: {
          userId: user.id
        }
      }
    }
  });

  return {
    user,
    space: newSpace
  };
}

export default async function seedDatabase () {
  await createUserFromWallet('0x0bdCC3f24822AD36CE4Fc1fa8Fe9FD6B235f0078');
  // const user = await
  return true;
}
