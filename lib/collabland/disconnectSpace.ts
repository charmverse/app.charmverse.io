import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { decryptData } from 'lib/utilities/dataEncryption';

export async function disconnectSpace(state: string) {
  const spaceData = decryptData(state);

  if (
    !spaceData ||
    typeof spaceData !== 'object' ||
    !spaceData.hasOwnProperty('spaceId') ||
    !spaceData.hasOwnProperty('userId')
  ) {
    throw new InvalidInputError('Invalid data provided');
  }

  const { userId, spaceId } = spaceData as { userId: string; spaceId: string };

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      userId,
      spaceId,
      isAdmin: true
    },
    select: {
      space: true
    }
  });

  if (!spaceRole || !spaceRole.space) {
    throw new InvalidInputError('Cannot find space to connect');
  }

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      discordServerId: null
    }
  });

  await prisma.role.deleteMany({
    where: {
      source: 'collabland'
    }
  });

  return updatedSpace;
}
