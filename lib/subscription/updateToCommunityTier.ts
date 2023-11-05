import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

export async function updateToCommunityTier(spaceId: string, userId: string) {
  const existingSpace = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      paidTier: true
    }
  });

  if (existingSpace.paidTier === 'enterprise') {
    throw new InvalidInputError(`This space is already on an Enterprise plan`);
  }

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      updatedAt: new Date(),
      updatedBy: userId,
      paidTier: 'community'
    }
  });
  return updatedSpace;
}
