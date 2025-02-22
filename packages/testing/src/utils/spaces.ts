import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import type { LoggedInUser } from '@packages/profile/getUser';
import { v4 } from 'uuid';

/**
 * Utility to add existing user to existing space
 */
export async function addUserToSpace({
  spaceId,
  isAdmin,
  userId
}: {
  spaceId: string;
  isAdmin?: boolean;
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
export async function generateSpaceForUser({
  user,
  isAdmin = true,
  spaceName = 'Example space',
  skipOnboarding = true
}: {
  user: LoggedInUser;
  isAdmin?: boolean;
  spaceName?: string;
  skipOnboarding?: boolean;
}) {
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
            isAdmin,
            // skip onboarding for normal test users
            onboarded: skipOnboarding
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
  customerId = v4(),
  subscriptionId = v4(),
  deletedAt = null
}: {
  spaceId: string;
  customerId?: string;
  subscriptionId?: string;
  deletedAt?: Date | null;
}) {
  const spaceSubscription = await prisma.stripeSubscription.create({
    data: {
      deletedAt,
      spaceId,
      customerId,
      subscriptionId
    }
  });

  return spaceSubscription;
}
