import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError } from 'lib/middleware';
import type { ProposalFields } from 'lib/proposal/interface';

import type { ProposalReviewerInput } from './interface';

export type UpdateProposalRequest = {
  proposalId: string;
  authors?: string[];
  reviewers?: ProposalReviewerInput[];
  categoryId?: string | null;
  evaluationType?: ProposalEvaluationType | null;
  publishToLens?: boolean;
  fields?: ProposalFields | null;
};

export async function updateProposal({
  proposalId,
  authors,
  reviewers,
  categoryId,
  evaluationType,
  publishToLens,
  fields
}: UpdateProposalRequest) {
  if (authors && authors.length === 0) {
    throw new InvalidStateError('Proposal must have at least 1 author');
  }

  await prisma.$transaction(async (tx) => {
    if (publishToLens !== undefined) {
      await tx.proposal.update({
        where: {
          id: proposalId
        },
        data: {
          publishToLens
        }
      });
    }

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

    // Update fields only when it is present in request payload
    if (fields) {
      await tx.proposal.update({
        where: {
          id: proposalId
        },
        data: {
          fields
        }
      });
    }

    // update authors only when it is present in request payload
    if (authors) {
      await tx.proposalAuthor.deleteMany({
        where: {
          proposalId
        }
      });
      await tx.proposalAuthor.createMany({
        data: authors.map((author) => ({ proposalId, userId: author }))
      });
    }

    // updatereviewers only when it is present in request payload
    if (reviewers) {
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
    }
  });
}
