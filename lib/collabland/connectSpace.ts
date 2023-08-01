import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { mapSpace } from 'lib/public-api/createWorkspaceApi';
import { decryptData } from 'lib/utilities/dataEncryption';

export async function connectSpace({ state, discordServerId }: { state: string; discordServerId: string }) {
  if (!discordServerId) {
    throw new InvalidInputError('A discord server ID must be provided');
  }

  const spaceData = decryptData(state);

  if (
    !spaceData ||
    typeof spaceData !== 'object' ||
    !spaceData.hasOwnProperty('spaceId') ||
    !spaceData.hasOwnProperty('userId')
  ) {
    throw new InvalidInputError('Invalid template provided');
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

  const space = await prisma.space.update({ where: { id: spaceId }, data: { discordServerId } });

  return mapSpace(space);
}
