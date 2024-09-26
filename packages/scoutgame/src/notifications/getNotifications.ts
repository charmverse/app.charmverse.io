import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export async function getNotifications({ userId }: { userId: string }) {
  if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError(`userId required for notifications`);
  }

  const activities = await prisma.scoutGameActivity.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return activities;
}
