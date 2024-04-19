import { prisma } from '@charmverse/core/prisma-client';
import { Prisma } from '@charmverse/core/prisma';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';

/**
 * Download page from production and load it into a space inside your local database
 *
 * Example usage:
 *
 *  dotenv -e .env.production -- tsx scripts/exportData/importPageToDev.ts
 *  ➜ Saved data to: page-backup-05-22.json
 *  dotenv -e .env.local -- tsx scripts/exportData/importPageToDev.ts
 *  ➜ Uploaded records
 */

// Details for production environment
const originalPagePath = 'april-13th-仮-020636547043172193';

// Detais for developer environment
const destinationSpaceDomain = 'free-space';
const destinationUserName = 'mattcasey.eth';

const fileName = `./page-backup-04-15.json`;
const pathName = path.join(process.cwd(), fileName);

type RestoreData = Awaited<ReturnType<typeof queryData>>;

async function queryData() {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      path: originalPagePath
    },
    include: { diffs: true }
  });
  return { page };
}

async function importData(data: RestoreData) {
  const newPageId = uuid();

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: destinationSpaceDomain
    }
  });
  const user = await prisma.user.findFirstOrThrow({
    where: {
      username: destinationUserName
    }
  });

  const pageDiffs: Prisma.PageDiffCreateManyInput[] = data.page.diffs.map((diff) => {
    return {
      ...diff,
      pageId: newPageId,
      createdBy: user.id
    } as Prisma.PageDiffCreateManyInput;
  });

  const pageToRestore = {
    ...data.page,
    proposalId: null,
    parentId: null,
    diffs: undefined,
    id: newPageId,
    path: data.page.path + '-restored-' + Date.now(),
    spaceId: space.id,
    createdBy: user.id,
    updatedBy: user.id
  };

  return prisma.$transaction([
    prisma.page.create({
      // @ts-ignore
      data: pageToRestore
    }),
    prisma.pagePermission.create({
      data: {
        pageId: newPageId,
        permissionLevel: 'view',
        spaceId: space.id
      }
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
      console.log('Saved data to: ', pathName);
    });
}

// run this while pointed at target database
function upload() {
  return readJson()
    .then(importData)
    .then((r) => console.log('Uploaded records', { pageId: r[0].id, pagePath: r[0].path }));
}

// download();
upload();
