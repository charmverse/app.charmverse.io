import { prisma } from '@charmverse/core/prisma-client';
import { Prisma } from '@charmverse/core/prisma';
import { generateFirstDiff } from '@packages/pages/generateFirstDiff';
import fs from 'node:fs/promises';
import path from 'node:path';

// This script restores the tree of deleted pages and boards based on a single parent

const fileName = `./prod-backup-08-01-2024.json`;
const pathName = path.join(process.cwd(), fileName);

type RestoreData = Awaited<ReturnType<typeof queryData>>;

// Change this to grab the data you want to restore
async function queryData() {
  const pages = await prisma.page.findMany({
    where: {
      deletedAt: {
        not: null
      },
      // spaceId: 'bc9e8464-4166-4f7c-8a14-bb293cc30d2a'
      parent: {
        path: 'page-5036309368959817'
      }
    },
    include: {
      diffs: true
    }
  });

  const children = await prisma.page.findMany({
    where: {
      parentId: {
        in: pages.map((page) => page.id)
      }
    },
    include: {
      diffs: true
    }
  });
  const subchildren = await prisma.page.findMany({
    where: {
      parentId: {
        in: children.map((p) => p.id)
      }
    },
    include: {
      diffs: true
    }
  });
  const subsubchildren = await prisma.page.findMany({
    where: {
      parentId: {
        in: subchildren.map((p) => p.id)
      }
    },
    include: {
      diffs: true
    }
  });
  const subsubsubchildren = await prisma.page.findMany({
    where: {
      parentId: {
        in: subsubchildren.map((p) => p.id)
      }
    },
    include: {
      diffs: true
    }
  });
  const subsubsubsubchildren = await prisma.page.findMany({
    where: {
      parentId: {
        in: subsubsubchildren.map((p) => p.id)
      }
    },
    include: {
      diffs: true
    }
  });
  const allPagesWithDiffs = [
    pages,
    children,
    subchildren,
    subsubchildren,
    subsubsubchildren,
    subsubsubsubchildren
  ].flat();
  const diffs = allPagesWithDiffs.map((page) => page.diffs).flat();
  const allPages = allPagesWithDiffs.map(({ diffs, ...page }) => page);
  const permissions = await prisma.pagePermission.findMany({
    where: {
      pageId: {
        in: allPages.map((p) => p.id)
      }
    }
  });
  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          id: {
            in: allPages.map((p) => p.boardId || p.cardId).filter(Boolean) as string[]
          }
        },
        {
          rootId: {
            in: allPages.map((p) => p.boardId).filter(Boolean) as string[]
          }
        }
      ]
    }
  });
  // console.log('boards', allPages.filter((p) => p.type === 'board' || p.type === 'inline_board').length);
  // console.log('cards', allPages.filter((p) => p.type === 'card' || p.type === 'card_template').length);
  // console.log('blocks', blocks.length);
  return { pages: allPages, blocks, diffs, permissions };
}

// Make sure this saves all the data you want to restore
async function saveData(data: RestoreData) {
  // fix incorrect data
  data.blocks.forEach((b) => {
    b.deletedAt = null;
  });
  data.pages.forEach((b) => {
    b.deletedAt = null;
  });

  const pagesExist = await prisma.page.findMany({
    where: {
      id: {
        in: data.pages.map((p) => p.id)
      }
    }
  });
  const blocksExist = await prisma.block.findMany({
    where: {
      id: {
        in: data.blocks.map((p) => p.id)
      }
    }
  });
  const permissions = await prisma.pagePermission.findMany({
    where: {
      id: {
        in: data.permissions.map((p) => p.id)
      }
    }
  });
  console.log(
    'card pages still exist',
    pagesExist.filter((p) => p.type === 'card').length,
    'out of',
    data.pages.filter((p) => p.type === 'card').length
  );
  console.log(
    'board pages still exist',
    pagesExist.filter((p) => p.type === 'board').length,
    'out of',
    data.pages.filter((p) => p.type === 'board').length
  );
  console.log('pages still exist', pagesExist.length, 'out of', data.pages.length, [
    ...new Set(pagesExist.map((b) => b.type))
  ]);
  console.log('blocks still exist', blocksExist.length, 'out of', data.blocks.length, [
    ...new Set(blocksExist.map((b) => b.type))
  ]);
  console.log('permissions still exist', permissions.length, 'out of', data.permissions.length);

  const blocksToRestore = data.blocks.filter((b) => !blocksExist.some((e) => e.id === b.id));
  const pagesToRestore = data.pages.filter((p) => !pagesExist.some((e) => e.id === p.id));

  // console.log(blocksToRestore.filter(b => b.type === 'board').map(b => b.id))
  console.log('restoring data', {
    blocks: blocksToRestore.length,
    boardBlocks: blocksToRestore.filter((b) => b.type === 'board').length,
    pages: pagesToRestore.length,
    permissions: data.permissions.length
  });

  await prisma.$transaction([
    prisma.block.createMany({
      // @ts-ignore
      data: blocksToRestore.filter((b) => b.type === 'board')
    }),
    prisma.block.createMany({
      // @ts-ignore
      data: blocksToRestore.filter((b) => b.type !== 'board')
    }),
    prisma.page.createMany({
      // @ts-ignore
      data: pagesToRestore
    }),
    prisma.pagePermission.createMany({
      data: data.permissions
    }),
    prisma.pageDiff.createMany({
      // @ts-ignore
      data: data.diffs
    })
  ]);
}

function readJson(): Promise<RestoreData> {
  return fs.readFile(pathName).then((file) => JSON.parse(file.toString()));
}

function writeJson(data: RestoreData) {
  return fs.writeFile(pathName, JSON.stringify(data, null, 2)).then(() => data);
}

// run this while pointed at a backup database
function download() {
  return queryData()
    .then(writeJson)
    .then((r) => {
      console.log('Saved data to: ', pathName, {
        blocks: r.blocks.length,
        pages: r.pages.length,
        permissions: r.permissions.length,
        diffs: r.diffs.length
      });
    });
}

// run this while pointed at target database
function upload() {
  return readJson()
    .then(saveData)
    .then((r) => console.log('Uploaded records'));
}

upload();
//download();
