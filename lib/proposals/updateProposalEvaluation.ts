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
  appealReviewers?: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
  appealable?: boolean;
  appealRequiredReviews?: number;
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
  currentEvaluationType
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
    if (appealable !== undefined) {
      await tx.proposalEvaluation.update({
        where: {
          id: evaluationId
        },
        data: {
          appealable
        }
      });
    }
    if (appealRequiredReviews) {
      await tx.proposalEvaluation.update({
        where: {
          id: evaluationId
        },
        data: {
          appealRequiredReviews
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
