import { createUserFromWallet } from 'lib/users/createUser';
import { provisionApiKey } from 'lib/middleware/requireApiKey';
import { User, Space, SpaceApiToken } from '@prisma/client';
import { LoggedInUser } from 'models';
import { prisma } from 'db';
import { v4 } from 'uuid';

/**
 * Simple utility to provide a user and space object inside test code
 * @param walletAddress
 * @returns
 */
export async function generateUserAndSpaceWithApiToken (walletAddress: string = '0x0bdCC3f24822AD36CE4Fc1fa8Fe9FD6B235f0078'): Promise<{
  user: LoggedInUser,
  space: Space,
  apiToken: SpaceApiToken
}> {
  const user = await createUserFromWallet(walletAddress);

  const existingSpaceId = user.spaceRoles?.[0]?.spaceId;

  let space: Space | null = null;

  if (existingSpaceId) {
    space = await prisma.space.findUnique({ where: { id: user.spaceRoles?.[0]?.spaceId }, include: { apiToken: true } });
  }

  if (!space) {
    space = await prisma.space.create({
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
      },
      include: {
        apiToken: true
      }
    });
  }

  const apiToken = (space as any).apiToken ?? await provisionApiKey(space.id);

  return {
    user,
    space,
    apiToken
  };
}

export default async function seedDatabase () {
  const { space } = await generateUserAndSpaceWithApiToken();

  await provisionApiKey(space.id);

  // const user = await
  return true;
}
