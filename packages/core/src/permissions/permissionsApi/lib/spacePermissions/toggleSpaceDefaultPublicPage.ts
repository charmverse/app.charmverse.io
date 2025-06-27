import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/core/errors';
import type { SpaceDefaultPublicPageToggle } from '@packages/core/permissions';

export async function toggleSpaceDefaultPublicPage({
  defaultPublicPages,
  spaceId
}: SpaceDefaultPublicPageToggle): Promise<Space> {
  if (typeof defaultPublicPages !== 'boolean') {
    throw new InvalidInputError('Public must be a boolean.');
  }

  try {
    const updatedSpace = await prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        defaultPublicPages
      }
    });

    return updatedSpace;
  } catch (err) {
    throw new DataNotFoundError(`Space with id ${spaceId} could not be found.`);
  }
}
