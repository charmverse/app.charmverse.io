import type { Space } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

import type { SpaceDefaultPublicPageToggle } from '../page-permission-interfaces';

export async function toggleSpaceDefaultPublicPage ({ defaultPublicPages, spaceId }: SpaceDefaultPublicPageToggle): Promise<Space> {

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

  }
  catch (err) {
    throw new DataNotFoundError(`Space with id ${spaceId} could not be found.`);
  }

}
