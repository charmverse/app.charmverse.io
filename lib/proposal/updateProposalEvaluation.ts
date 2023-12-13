import type { ProposalReviewer, ProposalEvaluationResult } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export type UpdateEvaluationRequest = {
  proposalId: string;
  evaluationId: string;
  result?: ProposalEvaluationResult | null;
  decidedBy?: string;
  reviewers?: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
};

export async function updateProposalEvaluation({
  proposalId,
  evaluationId,
  result,
  decidedBy,
  reviewers
}: UpdateEvaluationRequest) {
  await prisma.$transaction(async (tx) => {
    // updatereviewers only when it is present in request payload
    if (reviewers) {
      await tx.proposalReviewer.deleteMany({
        where: {
          evaluationId,
          proposalId
        }
      });
      await tx.proposalReviewer.createMany({
        data: reviewers.map((reviewer) => ({
          evaluationId,
          proposalId,
          ...reviewer
        }))
      });
    }
    if (result && decidedBy) {
      await tx.proposalEvaluation.update({
        where: {
          id: evaluationId
        },
        data: {
          result,
          decidedBy
        }
      });
    }
  });
}
