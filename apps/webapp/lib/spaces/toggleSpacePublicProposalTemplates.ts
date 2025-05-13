import { InvalidInputError } from '@charmverse/core/errors';
import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export type SpacePublicProposalTemplatesToggle = {
  spaceId: string;
  publicProposalTemplates: boolean;
};

export async function toggleSpacePublicProposalTemplates({
  publicProposalTemplates,
  spaceId
}: SpacePublicProposalTemplatesToggle): Promise<Space> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`SpaceId is required`);
  } else if (typeof publicProposalTemplates !== 'boolean') {
    throw new InvalidInputError(`Public proposal templates must be true or false`);
  }

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      publicProposalTemplates
    }
  });

  return updatedSpace;
}
