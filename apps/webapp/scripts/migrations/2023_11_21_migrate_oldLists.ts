import { prisma } from '@charmverse/core/prisma-client';

import { convertAndSavePage } from '@packages/bangleeditor/conversions/convertOldListNodes';

const cutoff = new Date('2023-11-01');
const perBatch = 2;

async function migrate({ offset = 0 }: { offset?: number } = {}) {
  const pages = await prisma.page.findMany({
    where: {
      createdAt: {
        lt: cutoff
      }
    },
    include: {
      diffs: true
    },
    orderBy: {
      id: 'asc'
    },
    skip: offset,
    take: perBatch
  });

  await Promise.all(
    pages.map(async (page) => {
      await convertAndSavePage(page);
    })
  );

  if (pages.length > 0) {
    console.log('checking', offset + perBatch, 'pages. last id: ' + pages[pages.length - 1]?.id);
    return migrate({ offset: offset + perBatch });
  }
}
(async () => {
  const pageCount = await prisma.page.count({
    where: {
      createdAt: {
        lt: cutoff
      }
    }
  });
  console.log('migrating', pageCount, 'pages');
  await migrate();
  console.log('done');
})();
