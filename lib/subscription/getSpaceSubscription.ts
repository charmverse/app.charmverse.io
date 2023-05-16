import { prisma } from '@charmverse/core';

export async function getSpaceSubscription({ spaceId }: { spaceId: string }) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      spaceSubscription: {
        where: {
          active: true
        },
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  const activeSpaceSubscription = space?.spaceSubscription[0];

  if (!activeSpaceSubscription) {
    return null;
  }

  return activeSpaceSubscription;
}
