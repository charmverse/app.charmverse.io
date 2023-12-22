import type { ProposalReviewer } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { VoteSettings } from './interface';

export type UpdateEvaluationRequest = {
  proposalId: string;
  evaluationId: string;
  voteSettings?: VoteSettings | null;
  reviewers?: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
};

export async function updateProposalEvaluation({
  proposalId,
  evaluationId,
  voteSettings,
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
    if (voteSettings) {
      await tx.proposalEvaluation.update({
        where: {
          id: evaluationId
        },
        data: {
          voteSettings
        }
      });
    }
  });
}
