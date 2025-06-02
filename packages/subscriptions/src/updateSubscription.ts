import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function updateSubscription({
  spaceId,
  newTier
}: {
  spaceId: string;
  newTier: SpaceSubscriptionTier;
  subscriptionCancelledAt?: Date | null;
}) {
  const { subscriptionTier } = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true
    }
  });

  await prisma.$transaction([
    prisma.space.update({
      where: { id: spaceId },
      data: {
        subscriptionTier: newTier
      }
    }),
    prisma.spaceSubscriptionTierChangeEvent.create({
      data: {
        spaceId,
        newTier,
        previousTier: subscriptionTier ?? 'readonly'
      }
    }),
    prisma.proposalWorkflow.updateMany({
      where: {
        spaceId
      },
      data: {
        archived: true
      }
    }),
    prisma.tokenGate.updateMany({
      where: {
        spaceId
      },
      data: {
        archived: true
      }
    }),
    prisma.role.updateMany({
      where: {
        spaceId
      },
      data: {
        archived: true
      }
    })
  ]);
}
