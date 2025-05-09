import { prisma } from '@charmverse/core/prisma-client';
import { Prisma } from '@charmverse/core/prisma';
import { generateFirstDiff } from '@packages/pages/generateFirstDiff';
import fs from 'node:fs/promises';
import path from 'node:path';

const fileName = `./prod-backup-02-11.json`;
const pathName = path.join(process.cwd(), fileName);

type RestoreData = Awaited<ReturnType<typeof queryData>>;

// Change this to grab the data you want to restore
async function queryData() {
  const spaceId = '6ad73203-39e4-41f2-ab02-570be300304e';

  const blocks = await prisma.block.findMany({
    where: {
      spaceId
    }
  });
  const boardBlocks = blocks.filter((b) => b.type === 'board');
  const boardBlockIds = boardBlocks.map((b) => b.id);
  const boardPages = await prisma.page.findMany({
    where: {
      spaceId,
      boardId: {
        in: boardBlockIds
      }
    }
  });

  const boardsToRestore = boardBlocks.filter(
    (b) => b.deletedAt && !boardPages.find((p) => p.boardId === b.id)?.deletedAt
  );
  const boardIdsToRestore = boardsToRestore.map((b) => b.id);

  console.log('board blocks to restore:', boardIdsToRestore.length);

  const allBlocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          rootId: {
            in: boardIdsToRestore
          }
        },
        {
          parentId: {
            in: boardIdsToRestore
          }
        },
        {
          id: {
            in: boardIdsToRestore
          }
        }
      ]
    }
  });
  const allPages = await prisma.page.findMany({
    where: {
      OR: [
        {
          boardId: {
            in: boardIdsToRestore
          }
        },
        {
          cardId: {
            in: allBlocks.filter((block) => block.type === 'card').map((block) => block.id)
          }
        }
      ]
    }
  });
  const permissions = await prisma.pagePermission.findMany({
    where: {
      pageId: {
        in: allPages.map((p) => p.id)
      }
    }
  });

  return { blocks: allBlocks, pages: allPages, permissions };
}

// Make sure this saves all the data you want to restore
async function saveData(data: RestoreData) {
  // fix incorrect data
  data.blocks.forEach((b) => {
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
  const permsToRestore = data.permissions.filter((p) => pagesToRestore.some((e) => e.id === p.pageId));

  // console.log(blocksToRestore.filter(b => b.type === 'board').map(b => b.id))
  console.log('restoring data', {
    blocks: blocksToRestore.length,
    boardBlocks: blocksToRestore.filter((b) => b.type === 'board').length,
    pages: pagesToRestore.length,
    permissions: permsToRestore.length
  });
  // record what we uploaded just in case we need it in the next few days, and since its not quite the same as the backup
  await fs.writeFile(
    path.join(process.cwd(), 'prod-restoredData.json'),
    JSON.stringify({ blocks: blocksToRestore, pages: pagesToRestore, permissions: permsToRestore }, null, 2)
  );

  const pageDiffs: Prisma.PageDiffCreateManyInput[] = pagesToRestore
    .filter((p) => !!p.content)
    .map((p) => {
      const diff = generateFirstDiff({
        createdBy: p.createdBy,
        content: p.content
      });
      return {
        ...diff,
        pageId: p.id
      } as Prisma.PageDiffCreateManyInput;
    });

  await prisma.$transaction([
    prisma.block.createMany({
      // @ts-ignore
      data: blocksToRestore
    }),
    prisma.page.createMany({
      // @ts-ignore
      data: pagesToRestore
    }),
    prisma.pagePermission.createMany({
      data: permsToRestore
    }),
    prisma.pageDiff.createMany({
      data: pageDiffs
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
        permissions: r.permissions.length
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
