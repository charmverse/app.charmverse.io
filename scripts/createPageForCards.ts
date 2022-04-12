import { prisma } from '../db';

(async () => {

  const cardBlocks = await prisma.block.findMany({
    where: {
      type: 'card'
    }
  });

  for (const cardBlock of cardBlocks) {
    const page = await prisma.block.findUnique({
      where: {
        id: cardBlock.id
      }
    });

    if (!page) {
      const fields = cardBlock.fields as any;
      await prisma.page.create({
        data: {
          createdBy: cardBlock.createdBy,
          updatedBy: cardBlock.updatedBy,
          id: cardBlock.id,
          spaceId: cardBlock.spaceId,
          cardId: cardBlock.id,
          createdAt: cardBlock.createdAt,
          path: `page-${cardBlock.id}`,
          title: fields?.title ?? '',
          icon: fields?.icon,
          type: 'page',
          headerImage: fields?.headerImage ?? '',
          contentText: ''
        }
      });
    }
  }

  process.exit();
})();
