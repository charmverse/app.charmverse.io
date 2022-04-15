import { prisma } from 'db';

async function deleteOrphanCards () {
  const cards = await prisma.block.findMany({
    where: {
      type: 'card'
    },
    select: {
      parentId: true
    }
  });

  let totalOrphanCards = 0;
  let index = 0;
  let page = 0;
  const cardsPerPage = 50;

  for (;index < cards.length;) {
    // eslint-disable-next-line
    const boards = await Promise.all(new Array(cardsPerPage).fill(0).map((_, index) => {
      return new Promise((resolve) => {
        const card = cards[(page * cardsPerPage) + index];
        if (card) {
          prisma.block.findUnique({
            where: {
              id: cards[(page * cardsPerPage) + index].parentId
            },
            select: {
              id: true
            }
          }).then(block => resolve(block));
        }
        else {
          resolve(null);
        }
      });
    }));

    page += 1;
    index += cardsPerPage;
    // eslint-disable-next-line
    const orphans = boards.filter(board => !board)
    totalOrphanCards += orphans.length;
    console.log(`Page: ${page}. Orphans: ${totalOrphanCards}`);
  }

  console.log('Total orphan cards ', totalOrphanCards);
}

deleteOrphanCards();
