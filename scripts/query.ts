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

  const acc = await prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        path: 'page-054678415655162294'
      }
    },
    select: {
      page: {
        select: {
          title: true,
          path: true
        }
      },
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        select: {
          type: true,
          id: true,
          index: true,
          result: true,
          reviewers: true,
          permissions: true
        }
      }
    }
  });

  console.log(JSON.stringify({acc}, null, 2))

  console.log(getCurrentEvaluation(acc.evaluations))
}

search().then(() => console.log('Done'));
