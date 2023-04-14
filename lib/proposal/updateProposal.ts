import { prisma } from '@charmverse/core';

import { InvalidStateError } from 'lib/middleware';

import type { ProposalReviewerInput, ProposalWithUsers } from './interface';

export interface UpdateProposalRequest {
  proposalId: string;
  authors: string[];
  reviewers: ProposalReviewerInput[];
  categoryId?: string | null;
}

export async function updateProposal({
  proposalId,
  authors,
  reviewers,
  categoryId
}: UpdateProposalRequest): Promise<ProposalWithUsers> {
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
      category: true
    }
  }) as Promise<ProposalWithUsers>;
}
