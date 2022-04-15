import { prisma } from 'db';
import log from 'lib/log';

async function deleteOrphanCards () {
  const cards = await prisma.block.findMany({
    where: {
      type: 'card'
    },
    select: {
      parentId: true,
      id: true
    }
  });

  let totalOrphanCards = 0;
  let index = 0;
  let page = 0;
  const cardsPerPage = 50;

  for (;index < cards.length;) {
    // eslint-disable-next-line
    const orphanCards = await Promise.all<null | string>(new Array(cardsPerPage).fill(0).map((_, index) => {
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
          }).then((board) => {
            if (!board) {
              resolve(card.id);
            }
            else {
              resolve(null);
            }
          });
        }
        else {
          resolve(null);
        }
      });
    }));
    page += 1;
    index += cardsPerPage;

    const orphanCardDeletionPromises: Promise<any>[] = [];
    orphanCards.forEach(orphanCard => {
      // Delete the orphan charm_text and card block
      if (orphanCard) {
        orphanCardDeletionPromises.push(prisma.block.delete({
          where: {
            id: orphanCard
          }
        }));
        orphanCardDeletionPromises.push(prisma.block.deleteMany({
          where: {
            type: 'charm_text',
            parentId: orphanCard
          }
        }));
      }
    });
    await Promise.all(orphanCardDeletionPromises);

    // eslint-disable-next-line
    const orphans = orphanCards.filter(orphanCard => orphanCard)
    totalOrphanCards += orphans.length;
    log.debug(`Page: ${page}. Orphans: ${totalOrphanCards}/${page * cardsPerPage}`);
  }

  log.debug('Total orphan cards ', totalOrphanCards);
}

deleteOrphanCards();
