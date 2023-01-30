import type { Space } from '@prisma/client';

import { prisma } from 'db';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { DuplicateDataError, InvalidInputError } from 'lib/utilities/errors';

export type UpdateableSpaceFields = Partial<Pick<Space, 'domain' | 'name' | 'spaceImage'>>;

export async function updateSpace(
  spaceId: string,
  { domain, name, spaceImage }: UpdateableSpaceFields
): Promise<Space> {
  if (!spaceId) {
    throw new InvalidInputError('A space ID is required');
  }

  if (domain) {
    const existingSpace = await prisma.space.findUnique({
      where: {
        domain
      },
      select: {
        id: true
      }
    });

    if (existingSpace && existingSpace.id !== spaceId) {
      throw new DuplicateDataError(`A space with the domain ${domain} already exists`);
    }
  }

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      domain,
      name,
      spaceImage
    }
  });

  updateTrackGroupProfile(updatedSpace);

  return updatedSpace;
}
