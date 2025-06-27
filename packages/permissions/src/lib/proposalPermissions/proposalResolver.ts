import type {
  Proposal,
  ProposalAppealReviewer,
  ProposalAuthor,
  ProposalEvaluation,
  ProposalEvaluationApprover,
  ProposalEvaluationPermission,
  ProposalReviewer,
  ProposalWorkflow
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, ProposalNotFoundError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

export type ProposalResource = Pick<
  Proposal,
  'id' | 'createdBy' | 'status' | 'spaceId' | 'archived' | 'archivedByAdmin'
> & {
  authors: ProposalAuthor[];
  evaluations: (Pick<ProposalEvaluation, 'id' | 'index' | 'result' | 'type' | 'finalStep' | 'appealedAt'> & {
    reviewers: ProposalReviewer[];
    appealReviewers: Pick<ProposalAppealReviewer, 'roleId' | 'userId'>[];
    permissions: ProposalEvaluationPermission[];
    evaluationApprovers: Pick<ProposalEvaluationApprover, 'roleId' | 'userId'>[];
  })[];
  workflow: Pick<ProposalWorkflow, 'privateEvaluations'> | null;
};

export function proposalResourceSelect() {
  return {
    id: true,
    status: true,
    spaceId: true,
    createdBy: true,
    authors: true,
    archived: true,
    archivedByAdmin: true,
    evaluations: {
      select: {
        id: true,
        index: true,
        result: true,
        type: true,
        permissions: true,
        reviewers: true,
        finalStep: true,
        appealedAt: true,
        appealReviewers: {
          select: {
            roleId: true,
            userId: true
          }
        },
        evaluationApprovers: {
          select: {
            userId: true,
            roleId: true
          }
        }
      }
    },
    workflow: {
      select: {
        privateEvaluations: true
      }
    }
  };
}

export async function proposalResolver({ resourceId }: { resourceId: string }): Promise<ProposalResource> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resource ID provided. Must be a UUID`);
  }
  const proposal = await prisma.proposal.findUnique({
    where: { id: resourceId },
    select: proposalResourceSelect()
  });

  if (!proposal) {
    throw new ProposalNotFoundError(resourceId);
  }
  return proposal;
}
