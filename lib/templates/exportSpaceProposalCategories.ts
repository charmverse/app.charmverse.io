import type { ProposalCategory } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getSpace } from 'lib/spaces/getSpace';

export type RoleExport = {
  proposalCategories: ProposalCategory[];
};

export async function exportSpaceProposalCategories({ spaceIdOrDomain }: { spaceIdOrDomain: string }) {
  const space = await getSpace(spaceIdOrDomain);

  const proposalCategories = await prisma.proposalCategory.findMany({
    where: {
      spaceId: space.id
    }
  });

  return {
    proposalCategories
  };
}
