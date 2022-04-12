
import { prisma } from '../db';

(async () => {

  const pages = await prisma.page.findMany({
    where: {
      boardId: {
        not: null
      }
    }
  });

  const pagesToUpdate = pages.filter(p => p.boardId !== p.id);

  for (const page of pagesToUpdate) {
    const children = await prisma.page.findMany({
      where: {
        parentId: page.id
      }
    });
    if (children.length > 0) {
      for (const child of children) {
        await prisma.page.update({
          where: {
            id: child.id
          },
          data: {
            parentId: page.parentId
          }
        });
      }
      console.log('fixed', children.length, 'children of a database', page.parentId, page.spaceId);
    }
    if (page.boardId) {
      await prisma.page.update({
        where: {
          id: page.id
        },
        data: {
          id: page.boardId
        }
      });
    }
  }
  console.log('fixed', pagesToUpdate.length, 'database pages');
  process.exit();
})();
