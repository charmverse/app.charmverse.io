import type { PageWithPermissions } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';

import type { PageWithProposal } from 'lib/pages';
import { DataNotFoundError } from 'lib/utilities/errors';

import type { ProposalWithUsersAndRubric } from './interface';

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
          category: true,
          draftRubricAnswers: true,
          rubricAnswers: true,
          rubricCriteria: true
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

  (proposalPage as any as PageWithProposal).proposal.page = { sourceTemplateId: proposalPage?.sourceTemplateId };

  return proposalPage as PageWithPermissions & { proposal: ProposalWithUsersAndRubric };
}
