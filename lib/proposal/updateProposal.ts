import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError } from 'lib/middleware';

import type { ProposalReviewerInput, ProposalWithUsersAndRubric } from './interface';

export type UpdateProposalRequest = {
  proposalId: string;
  authors: string[];
  reviewers: ProposalReviewerInput[];
  categoryId?: string | null;
  evaluationType?: ProposalEvaluationType | null;
};

export async function updateProposal({
  proposalId,
  authors,
  reviewers,
  categoryId,
  evaluationType
}: UpdateProposalRequest): Promise<ProposalWithUsersAndRubric> {
  if (authors.length === 0) {
    throw new InvalidStateError('Proposal must have at least 1 author');
  }

  await prisma.$transaction(async (tx) => {
    // Update category only when it is present in request payload
    if (categoryId) {
      await tx.proposal.update({
        where: {
          id: proposalId
        },
        data: {
          categoryId
        }
      });
    }
    // Update evaluationType only when it is present in request payload
    if (evaluationType) {
      await tx.proposal.update({
        where: {
          id: proposalId
        },
        data: {
          evaluationType
        }
      });
    }

    await tx.proposalAuthor.deleteMany({
      where: {
        proposalId
      }
    });
    await tx.proposalAuthor.createMany({
      data: authors.map((author) => ({ proposalId, userId: author }))
    });
    await tx.proposalReviewer.deleteMany({
      where: {
        proposalId
      }
    });
    await tx.proposalReviewer.createMany({
      data: reviewers.map((reviewer) => ({
        proposalId,
        userId: reviewer.group === 'user' ? reviewer.id : null,
        roleId: reviewer.group === 'role' ? reviewer.id : null
      }))
    });
  });

  return prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      authors: true,
      reviewers: true,
      category: true,
      rubricAnswers: true,
      rubricCriteria: true
    }
  }) as any as Promise<ProposalWithUsersAndRubric>;
}
