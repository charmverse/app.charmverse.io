import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

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

  if (publicProposals === false) {
    await prisma.inviteLink.deleteMany({
      where: {
        spaceId,
        visibleOn: 'proposals'
      }
    });
  }

  return updatedSpace;
}
