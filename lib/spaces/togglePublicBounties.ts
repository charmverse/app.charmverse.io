import { Space } from '@prisma/client';
import { prisma } from 'db';
import { validate } from 'uuid';
import { DataNotFoundError, InvalidInputError } from '../utilities/errors';
import { PublicBountyToggle } from './interfaces';

export async function togglePublicBounties ({ spaceId, publicBountyBoard }: PublicBountyToggle): Promise<Space> {

  if (typeof publicBountyBoard !== 'boolean') {
    throw new InvalidInputError('PublicBountyBoard must be true or false.');
  }
  else if (validate(spaceId) === false) {
    throw new InvalidInputError('Please provide a valid space ID.');
  }

  try {
    const updatedSpace = await prisma.space.update({
      where: { id: spaceId },
      data: {
        publicBountyBoard
      }
    });

    return updatedSpace;
  }
  catch (err) {
    throw new DataNotFoundError(`Space ${spaceId} not found.`);
  }

}

