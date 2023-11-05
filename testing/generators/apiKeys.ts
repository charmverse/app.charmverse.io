import type { SpaceApiToken, SuperApiToken } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

export async function generateSpaceApiKey({ spaceId }: { spaceId: string }): Promise<SpaceApiToken> {
  const botUser = await prisma.user.findFirst({
    where: {
      isBot: true,
      spaceRoles: {
        some: {
          spaceId
        }
      }
    },
    select: {
      id: true
    }
  });

  if (!botUser) {
    await prisma.user.create({
      data: {
        isBot: true,
        username: 'Bot',
        path: `user-${uuid()}`,
        spaceRoles: {
          create: {
            spaceId
          }
        }
      }
    });
  }

  return prisma.spaceApiToken.create({
    data: {
      token: uuid(),
      space: { connect: { id: spaceId } }
    }
  });
}

export async function generateSuperApiKey({ spaceId }: { spaceId?: string } = {}): Promise<SuperApiToken> {
  if (!spaceId) {
    return prisma.superApiToken.create({
      data: {
        token: uuid(),
        name: `super-api-key-${uuid()}`
      }
    });
  }

  const botUser = await prisma.user.findFirst({
    where: {
      isBot: true,
      spaceRoles: {
        some: {
          spaceId
        }
      }
    },
    select: {
      id: true
    }
  });

  if (!botUser) {
    await prisma.user.create({
      data: {
        isBot: true,
        username: 'Bot',
        path: `user-${uuid()}`,
        spaceRoles: {
          create: {
            spaceId
          }
        }
      }
    });
  }

  return prisma.superApiToken.create({
    data: {
      token: uuid(),
      name: `super-api-key-${uuid()}`,
      spaces: { connect: { id: spaceId } }
    }
  });
}
