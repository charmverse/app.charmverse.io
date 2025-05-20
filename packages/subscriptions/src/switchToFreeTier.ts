import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

export async function switchToFreeTier(spaceId: string, userId: string) {
  const space = await prisma.space.findFirstOrThrow({ where: { id: spaceId } });
  if (space.paidTier === 'enterprise') {
    throw new InvalidInputError(`This space is already on the enterprise plan`);
  }

  // these tiers convert to free immediately
  if (space.subscriptionTier === 'readonly' || space.subscriptionTier === 'grant') {
    const updatedSpace = await prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        updatedAt: new Date(),
        updatedBy: userId,
        subscriptionTier: 'free'
      }
    });
  } else {
    await prisma.spaceSubscriptionTierChangeEvent.create({
      data: {
        spaceId,
        previousTier: space.subscriptionTier ?? 'readonly',
        newTier: 'free'
      }
    });
  }
}
