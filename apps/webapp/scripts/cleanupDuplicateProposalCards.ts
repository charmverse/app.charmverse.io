import { Page, prisma } from '@charmverse/core/prisma-client';

async function cleanupDuplicateProposalCards() {
  const targetSpace = 'charmverse';

  // const space = await prisma.space.findUniqueOrThrow({
  //   where: {
  //     domain: targetSpace
  //   },
  //   select: {
  //     id: true
  //   }
  // })

  const proposalCards = (await prisma.page.findMany({
    where: {
      syncWithPageId: {
        not: null
      },
      parentId: {
        not: null
      }
      //spaceId: space.id
    },
    select: {
      id: true,
      syncWithPageId: true,
      parentId: true
    },
    orderBy: {
      createdBy: 'asc'
    }
  })) as { [key in keyof Pick<Page, 'id' | 'syncWithPageId' | 'parentId'>]: NonNullable<Page[key]> }[];

  const cardsToDelete = proposalCards.reduce(
    (acc, card) => {
      // Cards in different boards can have the same syncWithPageId, so we need to also dedupe by parent board id
      const key = `${card.parentId}-${card.syncWithPageId}`;

      if (!acc.cardMap[key]) {
        acc.cardMap[key] = card.id;
      } else {
        acc.cardIdsToDelete.push(card.id);
      }

      return acc;
    },
    { cardMap: {} as Record<string, string>, cardIdsToDelete: [] as string[] }
  );

  if (cardsToDelete.cardIdsToDelete.length > 0) {
    await prisma.$transaction(
      async (tx) => {
        await tx.page.deleteMany({
          where: {
            //          spaceId: space.id,
            type: 'card',
            id: {
              in: cardsToDelete.cardIdsToDelete
            }
          }
        });
        await tx.block.deleteMany({
          where: {
            // spaceId: space.id,
            type: 'card',
            id: {
              in: cardsToDelete.cardIdsToDelete
            }
          }
        });
      },
      { timeout: 60000 }
    );
    console.log('Deleted', cardsToDelete.cardIdsToDelete.length, 'duplicate cards');
  }
}
cleanupDuplicateProposalCards().then(() => {
  console.log('Done');
});
