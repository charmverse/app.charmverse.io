import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { DuplicateDataError, InvalidInputError } from 'lib/utilities/errors';

export type UpdateableSpaceFields = Partial<
  Pick<Space, 'notifyNewProposals' | 'hiddenFeatures' | 'domain' | 'name' | 'spaceImage'>
>;

export async function updateSpace(spaceId: string, updates: UpdateableSpaceFields): Promise<Space> {
  if (!spaceId) {
    throw new InvalidInputError('A space ID is required');
  }

  const { domain } = updates;

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
      domain: updates.domain,
      name: updates.name,
      spaceImage: updates.spaceImage,
      notifyNewProposals: updates.notifyNewProposals,
      hiddenFeatures: updates.hiddenFeatures
    }
  });

  updateTrackGroupProfile(updatedSpace);

  return updatedSpace;
}
