import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { updateEvaluationResult } from './submitEvaluationResult';

export async function updatePassFailEvaluationResultIfRequired({
  currentEvaluationType,
  evaluationId,
  proposalId,
  requiredReviews,
  spaceId,
  userId
}: {
  evaluationId: string;
  proposalId: string;
  requiredReviews?: number;
  userId: string;
  spaceId: string;
  currentEvaluationType?: ProposalEvaluationType;
}) {
  if (currentEvaluationType === 'pass_fail') {
    const existingEvaluationReviews = await prisma.proposalEvaluationReview.findMany({
      where: {
        evaluationId
      },
      select: {
        result: true
      }
    });

    if (existingEvaluationReviews.length === requiredReviews) {
      await updateEvaluationResult({
        decidedBy: userId,
        evaluationId,
        existingEvaluationReviews,
        proposalId,
        spaceId
      });
    }
  }
}
