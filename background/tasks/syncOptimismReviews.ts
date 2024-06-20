import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

export const spaceId = 'f3ddde2e-17e9-42b1-803d-0c72880e4669';
export const templateId = 'a8ac2799-5c79-45f7-9527-a1d52d717625';

// a custom script for grants round. copy reviews from one step to the next
export async function syncOptimismReviewsTask() {
  const proposals = await prisma.proposal.findMany({
    where: {
      spaceId,
      status: 'published',
      page: {
        sourceTemplateId: templateId,
        deletedAt: null
      }
    },
    include: {
      evaluations: {
        include: {
          reviews: true,
          reviewers: true
        }
      }
    }
  });

  let added = 0;

  for (const proposal of proposals) {
    const firstEvaluation = proposal.evaluations.find((evaluation) => evaluation.title === 'Rule Violation Check');
    const secondEvaluation = proposal.evaluations.find((evaluation) => evaluation.title === 'Full Review');
    if (!firstEvaluation || !secondEvaluation) {
      throw new Error(`Could not find evaluations to update: ${proposal.id}`);
    }

    const reviewsToAdd = firstEvaluation.reviews.filter(
      (review) =>
        !secondEvaluation.reviews.some((r) => r.reviewerId === review.reviewerId) &&
        // only add a review if the reviewer is in the second evaluation
        secondEvaluation.reviewers.some((r) => r.userId === review.reviewerId)
    );

    for (const { id, declineMessage, declineReasons, ...review } of reviewsToAdd) {
      await prisma.proposalEvaluationReview.create({
        data: {
          ...review,
          evaluationId: secondEvaluation.id
        }
      });
      log.info('Synced review:', { proposalId: proposal.id, result: review.result, userId: review.reviewerId });
      added += 1;
    }
  }
  log.info('Synced reviews in Optimism space:', { added });
}
