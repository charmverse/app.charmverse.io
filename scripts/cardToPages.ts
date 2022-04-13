import { prisma } from '../db';

(async () => {

  const cards = await prisma.block.findMany({
    where: {
      type: 'card'
    }
  });

  for (const card of cards) {
    const page = await prisma.page.findUnique({
      where: {
        id: card.id
      }
    });

    if (!page) {
      const id = Math.random().toString().replace('0.', '');
      await prisma.page.create({
        data: {
          id: card.id,
          contentText: '',
          path: `page-${id}`,
          spaceId: card.spaceId,
          createdBy: card.createdBy,
          createdAt: card.createdAt,
          updatedBy: card.updatedBy,
          updatedAt: card.updatedAt,
          title: card.title,
          type: 'page',
          cardId: card.id,
          // Set these fields to null as another migration will be run to transfer the metadata from the card
          headerImage: null,
          icon: null,
          // This would point to the board, but the board id is the same as the page id
          parentId: card.parentId,
          permissions: {
            create: [
              {
                permissionLevel: 'full_access',
                spaceId: card.spaceId
              }
            ]
          }
        }
      });
    }
  }

  process.exit();
})();
