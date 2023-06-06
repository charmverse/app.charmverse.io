import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export async function toggleRequireProposalTemplate({
  requireProposalTemplate,
  spaceId
}: {
  requireProposalTemplate: boolean;
  spaceId: string;
}): Promise<Space> {
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
