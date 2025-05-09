import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export type SpaceRequireProposalTemplateToggle = {
  requireProposalTemplate: boolean;
  spaceId: string;
};

export async function toggleRequireProposalTemplate({
  requireProposalTemplate,
  spaceId
}: SpaceRequireProposalTemplateToggle): Promise<Space> {
  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      requireProposalTemplate
    }
  });

  return updatedSpace;
}
