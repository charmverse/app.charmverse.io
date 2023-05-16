import { prisma } from '@charmverse/core';
import type { SpaceSubscription } from '@charmverse/core/dist/cjs/prisma';
import { v4 } from 'uuid';

import { sessionUserRelations } from 'lib/session/config';
import type { LoggedInUser } from 'models';

/**
 * Utility to add existing user to existing space
 */
export async function addUserToSpace({
  spaceId,
  isAdmin,
  userId
}: {
  spaceId: string;
  isAdmin: boolean;
  userId: string;
}): Promise<LoggedInUser> {
  return prisma.user.update({
    where: {
      id: userId
    },
    data: {
      spaceRoles: {
        create: {
          space: {
            connect: {
              id: spaceId
            }
          },
          isAdmin
        }
      }
    },
    include: sessionUserRelations
  });
}

/**
 * Utility to create a space by existing user
 */
export async function generateSpaceForUser(user: LoggedInUser, isAdmin = true, spaceName = 'Example space') {
  const existingSpaceId = user.spaceRoles?.[0]?.spaceId;

  let space = null;

  if (existingSpaceId) {
    space = await prisma.space.findUnique({
      where: { id: user.spaceRoles?.[0]?.spaceId },
      include: { apiToken: true, spaceRoles: true }
    });
  }

  if (!space) {
    space = await prisma.space.create({
      data: {
        name: spaceName,
        // Adding prefix avoids this being evaluated as uuid
        domain: `domain-${v4()}`,
        author: {
          connect: {
            id: user.id
          }
        },
        updatedBy: user.id,
        updatedAt: new Date().toISOString(),
        spaceRoles: {
          create: {
            userId: user.id,
            isAdmin
          }
        }
      },
      include: {
        apiToken: true,
        spaceRoles: true
      }
    });
  }

  return space;
}

export async function addSpaceSubscription({
  spaceId,
  active = true,
  customerId = v4(),
  period = 'monthly',
  productId = v4(),
  subscriptionId = v4(),
  usage = 1
}: { spaceId: string } & Partial<Omit<SpaceSubscription, 'spaceId'>>) {
  const spaceSubscription = await prisma.spaceSubscription.create({
    data: {
      spaceId,
      active,
      customerId,
      period,
      usage,
      productId,
      subscriptionId
    }
  });

  return spaceSubscription;
}
