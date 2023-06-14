import { InvalidInputError } from '@charmverse/core/errors';
import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export type SpacePublicProposalToggle = {
  spaceId: string;
  publicProposals: boolean;
};

export async function toggleSpacePublicProposals({
  publicProposals,
  spaceId
}: SpacePublicProposalToggle): Promise<Space> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`SpaceId is required`);
  } else if (typeof publicProposals !== 'boolean') {
    throw new InvalidInputError(`Public proposals must be a boolean`);
  }

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      publicProposals
    }
  });

  return updatedSpace;
}
