import type { ProposalReviewer } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export type UpdateEvaluationRequest = {
  proposalId: string;
  evaluationId: string;
  reviewers?: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
};

export async function updateProposalEvaluation({ proposalId, evaluationId, reviewers }: UpdateEvaluationRequest) {
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
  });
}
