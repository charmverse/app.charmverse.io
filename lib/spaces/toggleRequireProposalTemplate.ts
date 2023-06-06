import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export async function toggleRequireProposalTemplate({
  requireProposalTemplate,
  spaceId
}: {
  requireProposalTemplate: boolean;
  spaceId: string;
}): Promise<Space> {
  if (typeof requireProposalTemplate !== 'boolean') {
    throw new InvalidInputError('Public must be a boolean.');
  }

  try {
    const updatedSpace = await prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        requireProposalTemplate
      }
    });

    return updatedSpace;
  } catch (err) {
    throw new DataNotFoundError(`Space with id ${spaceId} could not be found.`);
  }
}
