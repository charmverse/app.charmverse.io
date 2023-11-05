import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { stringUtils } from '@charmverse/core/utilities';

export type ArchiveProposalRequest = {
  archived: boolean;
  proposalId: string;
};

export async function archiveProposal({ archived, proposalId }: ArchiveProposalRequest): Promise<ProposalWithUsers> {
  if (typeof archived !== 'boolean') {
    throw new InvalidInputError(`Property "archived" must be true or false`);
  } else if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Proposal ID must be a valid proposal ID`);
  }

  const updatedProposal = await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      archived
    },
    include: {
      category: true,
      authors: true,
      reviewers: true
    }
  });

  return updatedProposal;
}
