import { Page, Prisma, Space, SpaceApiToken } from '@prisma/client';
import { prisma } from 'db';
import { provisionApiKey } from 'lib/middleware/requireApiKey';
import { createUserFromWallet } from 'lib/users/createUser';
import { LoggedInUser } from 'models';
import { v4 } from 'uuid';
import { IPageWithPermissions } from 'lib/pages/server';

/**
 * Simple utility to provide a user and space object inside test code
 * @param walletAddress
 * @returns
 */
export async function generateUserAndSpaceWithApiToken (walletAddress: string = v4()): Promise<{
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
            userId: user.id,
            isAdmin: true
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

export function createPage (options: Pick<Page, 'spaceId' | 'createdBy'> & Partial<Pick<Page, 'parentId' | 'title' | 'content'>>): Promise<IPageWithPermissions> {
  return prisma.page.create({
    data: {
      contentText: '',
      path: v4(),
      title: options.title || 'Example',
      type: 'page',
      updatedBy: options.createdBy,
      content: options.content as Prisma.InputJsonObject,
      author: {
        connect: {
          id: options.createdBy
        }
      },
      space: {
        connect: {
          id: options.spaceId as string
        }
      },
      parentId: options.parentId
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });
}

export default async function seedDatabase () {
  const { space } = await generateUserAndSpaceWithApiToken();

  await provisionApiKey(space.id);

  // const user = await
  return true;
}
