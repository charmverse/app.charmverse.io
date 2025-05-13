// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';

async function createProposalEvaluationAppealReviews() {
  const proposalEvaluationReviews = await prisma.proposalEvaluationReview.findMany({
    where: {
      appeal: true
    }
  });

  for (const proposalEvaluationReview of proposalEvaluationReviews) {
    try {
      await prisma.$transaction([
        prisma.proposalEvaluationAppealReview.create({
          data: {
            evaluationId: proposalEvaluationReview.evaluationId,
            reviewerId: proposalEvaluationReview.reviewerId,
            result: proposalEvaluationReview.result,
            completedAt: proposalEvaluationReview.completedAt,
            declineReasons: proposalEvaluationReview.declineReasons
          }
        }),
        prisma.proposalEvaluationReview.delete({
          where: {
            id: proposalEvaluationReview.id
          }
        })
      ]);
    } catch (error) {
      console.error(`Error creating proposal evaluation appeal review: ${error}`);
    }
  }
}

createProposalEvaluationAppealReviews().then(() => console.log('Done!'));
