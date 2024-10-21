/* eslint-disable no-console */
import { prisma } from '@charmverse/core/prisma-client';
import { permissionsApiClient } from 'lib/permissions/api/client';

/**
 * Publish or unpublish all cards in a board, and the board itself
 */
async function toggleBoardPublishedState(boardId: string, publish: boolean): Promise<true> {
  if (publish === false) {
    await prisma.pagePermission.deleteMany({
      where: {
        AND: [
          {
            public: true
          },
          {
            OR: [
              {
                pageId: boardId
              },
              {
                page: {
                  parentId: boardId
                }
              }
            ]
          }
        ]
      }
    });
    return true;
  }

  // Publish the board
  await permissionsApiClient.pages.upsertPagePermission({
    pageId: boardId,
    permission: {
      assignee: {
        group: 'public'
      },
      permissionLevel: 'view'
    }
  });

  const cardsInBoard = await prisma.page.findMany({
    where: {
      parentId: boardId
    },
    select: {
      id: true
    }
  });

  const totalCards = cardsInBoard.length;

  let processed = 0;

  for (const card of cardsInBoard) {
    await permissionsApiClient.pages.upsertPagePermission({
      pageId: card.id,
      permission: {
        assignee: { group: 'public' },
        permissionLevel: 'view'
      }
    });
    processed += 1;
    console.log(`Processed card ${processed} / ${totalCards}`);
  }

  return true;
}

toggleBoardPublishedState('217ed9dc-36be-469b-af96-4d21610856a1', true).then(() => {
  console.log('Complete');
});

/* Testing utility to delete all inheritance relationships
prisma.pagePermission.updateMany({
  data: {
    inheritedFromPermission: null
  }
}).then(() => {
  console.log('Inheritance deleted');
});
*/

/* Run this function
prisma.$connect()
  .then(() => {
    console.log('Connected to DB');
    inheritPermissions(0)
      .then(() => {
        console.log('Success');
      });
  });

*/
