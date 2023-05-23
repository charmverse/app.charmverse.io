import type { PageWithPermissions } from '@charmverse/core';
import { prisma } from '@charmverse/core/prisma-client';

import type { PageWithProposal } from 'lib/pages';
import { DataNotFoundError } from 'lib/utilities/errors';

/**
 *
 * @param param0
 * @returns
 */
export async function getProposal({
  proposalId
}: {
  proposalId: string;
}): Promise<PageWithPermissions & PageWithProposal> {
  const proposalPage = await prisma.page.findUnique({
    where: {
      proposalId
    },
    include: {
      proposal: {
        include: {
          authors: true,
          reviewers: true,
          category: true
        }
      },
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  if (!proposalPage) {
    throw new DataNotFoundError(`Proposal with id ${proposalId} not found`);
  }

  return proposalPage;
}
