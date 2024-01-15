import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { prisma } from '@charmverse/core/prisma-client';

/**

  userId: cb9a5ede-6ff7-4eaa-9c23-91e684e23aed
  spaceId: 33918abc-f753-4a3d-858d-63c3fa36fa15

  kameil userId: f7d47848-f993-4d16-8008-e1f5b23b8ad3 or 356af4f7-cbd1-4350-b046-9f55da500fec
*/

/**
 * Use this script to perform database searches.
 */

async function search() {
  const results = await Promise.all([
    prisma.proposalReviewer.findMany({
      where: {
        evaluationId: null
      },
      include: {
        proposal: {
          select: {
            page: {
              select: {
                createdAt: true
              }
            }
          }
        }
      }
    }),
    prisma.proposalRubricCriteria.findMany({
      where: {
        evaluationId: null
      },
      include: {
        proposal: {
          select: {
            page: {
              include: {
                space: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    }),
    prisma.proposalRubricCriteriaAnswer.findMany({
      where: {
        evaluationId: null
      },
      include: {
        proposal: {
          select: {
            page: {
              select: {
                createdAt: true
              }
            }
          }
        }
      }
    }),
    prisma.draftProposalRubricCriteriaAnswer.findMany({
      where: {
        evaluationId: null
      }
    })
  ]);

  results.forEach((count, i) => {
    console.log(count.length);
    console.log(count.map((c) => c.proposal?.page.space?.name));
  });
}

search().then(() => console.log('Done'));
