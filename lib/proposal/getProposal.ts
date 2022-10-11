import { truncate } from 'fs/promises';

import { prisma } from 'db';
import type { IPageWithPermissions, PageWithProposal } from 'lib/pages';
import { DataNotFoundError } from 'lib/utilities/errors';

/**
 *
 * @param param0
 * @returns
 */
export async function getProposal ({ proposalId }: { proposalId: string }): Promise<IPageWithPermissions & PageWithProposal> {
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
