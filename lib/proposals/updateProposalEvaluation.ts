import type { ProposalEvaluationType, ProposalReviewer } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { VoteSettings } from './interfaces';
import { setPageUpdatedAt } from './setPageUpdatedAt';
import { updatePassFailEvaluationResultIfRequired } from './updatePassFailEvaluationResultIfRequired';

export type UpdateEvaluationRequest = {
  proposalId: string;
  evaluationId: string;
  voteSettings?: VoteSettings | null;
  requiredReviews?: number;
  reviewers?: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
  currentEvaluationType?: ProposalEvaluationType;
  spaceId: string;
};

export async function updateProposalEvaluation({
  proposalId,
  spaceId,
  evaluationId,
  voteSettings,
  reviewers,
  actorId,
  requiredReviews,
  currentEvaluationType
}: UpdateEvaluationRequest & { actorId: string }) {
  await prisma.$transaction(async (tx) => {
    // update reviewers only when it is present in request payload
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
    if (requiredReviews) {
      await tx.proposalEvaluation.update({
        where: {
          id: evaluationId
        },
        data: {
          requiredReviews
        }
      });
    }
  });

  if (requiredReviews) {
    await updatePassFailEvaluationResultIfRequired({
      currentEvaluationType,
      evaluationId,
      proposalId,
      requiredReviews,
      spaceId,
      userId: actorId
    });
  }

  await setPageUpdatedAt({ proposalId, userId: actorId });
}
