import type { IPageWithPermissions, PageWithProposal } from 'lib/pages';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { truncate } from 'fs/promises';

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
