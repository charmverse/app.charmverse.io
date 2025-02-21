import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';

import { appendFileSync, readFileSync } from 'fs';
import { isTruthy } from '@packages/lib/utils/types';
const FILE_PATH = './orphans.txt';

const userId = '4e1d4522-6437-4393-8ed1-9c56e53235f4';

const totalPages = 404701;
const perBatch = 1000;

let count = 0;
let nonCardOrphanCount = 0;

export async function findOrphans({ offset = 0 }: { offset?: number } = {}) {
  // Load limited number of spaces at a time
  const result = await prisma.page.findMany({
    where: {
      parentId: {
        not: null
      }
    },
    select: {
      id: true,
      parentId: true,
      type: true
      // title: true
      // space: {
      //   select: {
      //     domain: true
      //   }
      // }
    },
    skip: offset,
    take: perBatch,
    orderBy: {
      id: 'asc'
    }
  });
  // console.log(result);
  const parents = await prisma.page.findMany({
    where: {
      id: {
        in: uniq(result.map((r) => r.parentId)).filter(isTruthy)
      }
    }
  });
  const orphans = result.filter((r) => !parents.find((p) => p.id === r.parentId));
  const nonCardOrphans = orphans.filter((r) => !r.type.startsWith('card'));
  nonCardOrphanCount += nonCardOrphans.length;
  count += orphans.length;
  if (result.length > 0) {
    if (offset % 10000) {
      console.log('Offset:', offset, '. Found', count, 'orphans.', totalPages - offset, 'pages left');
      // if (orphans.length > 0) {
      //   console.log(orphans[0]);
      // }
    }
    orphans.forEach((o) => {
      appendFileSync(FILE_PATH, `\n${o.id}`);
    });
    return findOrphans({ offset: offset + perBatch });
  }
  return count;
}
async function search() {
  const count = await findOrphans();
  console.log('Orphans:', count);
  // console.log(spaces.length);
}

let counts = {
  pages: 0,
  boards: 0,
  deletedBoards: 0,
  cards: 0
};

async function cleanup() {
  const pageIds = readFileSync(FILE_PATH + '.txt', 'utf-8')
    .split('\n')
    .filter(Boolean);
  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: pageIds
      },
      parentId: {
        not: null
      }
    },
    // include: {
    //   card: true
    // },
    select: {
      type: true,
      id: true,
      updatedAt: true,
      title: true,
      contentText: true,
      boardId: true,
      cardId: true
    }
  });

  for (let page of pages) {
    console.log('processing', page.type, page.id, page.boardId, page.cardId);
    if (page.type.includes('board')) {
      // console.log('board', page.boardId);
      const block = await prisma.block.findFirst({
        where: {
          id: page.boardId || page.id,
          deletedAt: null
        }
      });
      if (block) {
        counts.boards++;
        await prisma.page.update({
          where: {
            id: page.id
          },
          data: {
            parentId: null
          }
        });
      } else {
        counts.deletedBoards++;
        await prisma.page.delete({
          where: {
            id: page.id
          }
        });
      }
    } else if (page.type.includes('card')) {
      counts.cards++;
      if (page.cardId) {
        await prisma.block.delete({
          where: {
            id: page.cardId || page.id
          }
        });
      } else {
        await prisma.page.delete({
          where: {
            id: page.id
          }
        });
      }
    } else {
      counts.pages++;
      await prisma.page.update({
        where: {
          id: page.id
        },
        data: {
          parentId: null
        }
      });
    }
  }
  console.log(counts);
}

search().then(() => console.log('Done'));
