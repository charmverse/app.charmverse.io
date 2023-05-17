import type { StripePayment, StripeSubscription } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
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
  customerId = v4(),
  period = 'monthly',
  productId = v4(),
  subscriptionId = v4(),
  createdBy,
  deletedAt = null,
  amount = 100,
  currency = 'USD',
  paymentId = v4(),
  status = 'success'
}: { spaceId: string; createdBy: string } & Partial<Omit<StripeSubscription, 'spaceId' | 'createdBy'>> &
  Partial<StripePayment>) {
  const spaceSubscription = await prisma.stripeSubscription.create({
    data: {
      deletedAt,
      spaceId,
      customerId,
      period,
      productId,
      createdBy,
      subscriptionId,
      stripePayment: {
        create: {
          amount,
          currency,
          paymentId,
          status
        }
      }
    }
  });

  return spaceSubscription;
}
