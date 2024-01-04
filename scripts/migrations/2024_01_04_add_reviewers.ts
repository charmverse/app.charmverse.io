import { prisma } from '@charmverse/core/prisma-client';

async function migrate() {
  const evaluations = await prisma.proposalEvaluation.findMany({
    where: {
      proposal: {
        status: 'published',
        page: {
          type: 'proposal'
        }
      },
      type: {
        not: 'feedback'
      },
      reviewers: {
        none: {}
      }
    },
    include: {
      proposal: {
        include: {
          evaluations: true,
          page: {
            select: {
              createdAt: true
            }
          },
          reviewers: true
        }
      }
    }
  });

  for (let evaluation of evaluations) {
    const proposalReviewers = evaluation.proposal.reviewers;
    if (proposalReviewers.length > 0) {
      await prisma.proposalReviewer.createMany({
        data: proposalReviewers.map((reviewer) => ({
          ...reviewer,
          evaluationId: evaluation.id
        }))
      });
    } else {
      console.warn('proposal had no reviewers');
    }
  }
}

migrate().then(() => console.log('Done'));
