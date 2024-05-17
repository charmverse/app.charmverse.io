import type { Prisma, ProposalEvaluationType, ProposalReviewer } from '@charmverse/core/prisma';
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
  appealReviewers?: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[] | null;
  appealable?: boolean | null;
  appealRequiredReviews?: number | null;
  finalStep?: boolean;
};

export async function updateProposalEvaluation({
  proposalId,
  spaceId,
  evaluationId,
  voteSettings,
  reviewers,
  appealRequiredReviews,
  appealReviewers,
  appealable,
  actorId,
  requiredReviews,
  currentEvaluationType,
  finalStep
}: UpdateEvaluationRequest & { currentEvaluationType?: ProposalEvaluationType; actorId: string; spaceId: string }) {
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
    if (appealReviewers) {
      await tx.proposalAppealReviewer.deleteMany({
        where: {
          evaluationId,
          proposalId
        }
      });
      await tx.proposalAppealReviewer.createMany({
        data: appealReviewers.map((reviewer) => ({
          evaluationId,
          proposalId,
          ...reviewer
        }))
      });
    }

    const updateData: Prisma.ProposalEvaluationUpdateInput = {};

    if (voteSettings) {
      updateData.voteSettings = voteSettings;
    }
    if (requiredReviews) {
      updateData.requiredReviews = requiredReviews;
    }
    if (appealable !== undefined) {
      updateData.appealable = appealable;
    }
    if (appealRequiredReviews) {
      updateData.appealRequiredReviews = appealRequiredReviews;
    }
    if (finalStep !== undefined) {
      updateData.finalStep = finalStep;
    }

    if (Object.keys(updateData).length > 0) {
      await tx.proposalEvaluation.update({
        where: {
          id: evaluationId
        },
        data: updateData
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
