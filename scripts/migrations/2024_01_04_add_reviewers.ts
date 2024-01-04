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
          page: {
            select: {
              type: true
            }
          },
          reviewers: true
        }
      }
    }
  });

  console.log(`Found ${evaluations.length} evaluations`);

  for (let evaluation of evaluations) {
    const proposalReviewers = evaluation.proposal.reviewers;
    if (proposalReviewers.length > 0) {
      await prisma.proposalReviewer.createMany({
        data: proposalReviewers.map(({ id, ...reviewer }) => ({
          ...reviewer,
          evaluationId: evaluation.id
        }))
      });
    } else {
      console.warn(evaluation.proposal.page?.type + ' had no reviewers');
    }
  }
}

migrate().then(() => console.log('Done'));
