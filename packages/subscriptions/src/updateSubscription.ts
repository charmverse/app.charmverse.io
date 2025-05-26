import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { downgradeableTiers } from './constants';

export async function updateSubscription({
  spaceId,
  newTier,
  currentTier
}: {
  spaceId: string;
  newTier: SpaceSubscriptionTier;
  currentTier?: SpaceSubscriptionTier;
}) {
  const previousTierIndex = currentTier ? downgradeableTiers.indexOf(currentTier) : 0;
  const currentTierIndex = downgradeableTiers.indexOf(newTier);

  const isDowngrading = currentTierIndex < previousTierIndex;

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
        newTier: 'readonly',
        previousTier: newTier
      }
    }),
    ...(isDowngrading
      ? [
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
        ]
      : [])
  ]);
}
