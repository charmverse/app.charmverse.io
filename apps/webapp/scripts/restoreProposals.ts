import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@charmverse/core/prisma-client';

function writeData(data: any) {
  return fs.writeFile(path.join(process.cwd(), 'prod-restoredData.json'), JSON.stringify(data, null, 2));
}

async function readData() {
  const str = await fs.readFile(path.join(process.cwd(), 'prod-restoredData.json'), { encoding: 'utf-8' });
  return JSON.parse(str);
}

async function download() {
  const page = await prisma.page.findMany({
    where: {
      title: 'Proposal Review - Grants Council Only'
      //title: 'Xandra/Matt Copy: Proposal Review - Grants Council Only (Copy)'
    }
  });
  const pages = await prisma.page.findMany({
    where: {
      parentId: page[0].id
    },
    include: {
      permissions: true,
      card: true,
      inlineComments: true,
      comments: true,
      threads: true,
      userSpaceActions: true
    }
  });
  console.log('Recording pages, count:', pages.length);
  const results = { pages };
  await writeData(results);
}

async function deleteTable() {
  const page = await prisma.page.findMany({
    where: {
      //  title: 'Proposal Review - Grants Council Only'
      title: 'Xandra/Matt Copy: Proposal Review - Grants Council Only (Copy)'
    }
  });
  const parentId = page[0].id;
  console.log('found page', parentId);
  const res = await prisma.page.deleteMany({
    where: {
      parentId,
      space: {
        domain: 'taiko'
      }
    }
  });
  console.log('deleted pages', res);
  const blockRes = await prisma.block.deleteMany({
    where: {
      parentId,
      space: {
        domain: 'taiko'
      }
    }
  });
  console.log('deleted blocks', blockRes);
  await prisma.page.delete({
    where: {
      id: parentId
    }
  });
}

async function upload() {
  const page = await prisma.page.findMany({
    where: {
      //  title: 'Proposal Review - Grants Council Only'
      title: 'Matt Migration Proposal Review - Grants Council Only (Copy)'
    }
  });
  const parentId = page[0].id;
  const pages = await prisma.page.findMany({
    where: {
      parentId
    }
  });
  console.log(pages.length);
  const data = await readData();
  const pagesToNotUpload = await prisma.page.findMany({
    where: {
      id: {
        in: data.pages.map((p: { id: string }) => p.id)
      }
    },
    select: {
      id: true
    }
  });
  const pagesToUpload = data.pages?.filter((p: { id: string }) => !pagesToNotUpload.some((page) => page.id === p.id));
  console.log('pages to upload', pagesToUpload.length);
  let updated = 0;
  try {
    for (const page of pagesToUpload) {
      const pageToDelete = pages.find((p) => p.syncWithPageId === page.syncWithPageId);
      const { permissions, card, inlineComments, comments, threads, diffs, userSpaceActions, ...rest } = page;

      card.parentId = card.rootId = parentId;
      rest.parentId = parentId;
      console.log('uploading page', { cardId: card.id, pageId: rest.id });
      if (!pageToDelete) {
        console.log('no page to delete');
      } else {
        await prisma.page.delete({ where: { id: pageToDelete.id } });
      }
      await prisma.$transaction([
        prisma.block.create({
          data: card
        }),
        prisma.page.create({
          data: rest
        }),
        prisma.pageComment.createMany({
          data: comments
        }),
        prisma.thread.createMany({
          data: threads
        }),
        prisma.comment.createMany({
          data: inlineComments
        }),
        prisma.pagePermission.createMany({
          data: permissions
        }),
        prisma.userSpaceAction.createMany({
          data: userSpaceActions
        })
      ]);
      updated++;
    }
  } catch (err) {
    console.error(err);
  } finally {
    console.log('updated rows', updated);
  }
}

upload().then(() => console.log('Done'));
