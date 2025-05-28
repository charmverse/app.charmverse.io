import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function updateSubscription({
  spaceId,
  newTier,
  currentTier
}: {
  spaceId: string;
  newTier: SpaceSubscriptionTier;
  currentTier?: SpaceSubscriptionTier;
  subscriptionCancelledAt?: Date | null;
}) {
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
        previousTier: currentTier ?? 'readonly'
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
