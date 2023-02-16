import type { ProposalCategory } from '@prisma/client';

import { prisma } from 'db';
import { stringToColor } from 'lib/utilities/strings';

export async function generateProposalCategory({
  spaceId,
  title = `Category-${Math.random()}`
}: {
  spaceId: string;
  title?: string;
}): Promise<Required<ProposalCategory>> {
  return prisma.proposalCategory.create({
    data: {
      title,
      space: { connect: { id: spaceId } },
      color: stringToColor(title)
    }
  });
}
