import { prisma } from 'db';
import { setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages/triggers';
import { cond } from 'lodash';
import { resolve } from 'node:path/win32';
import { resolveChildPages } from '../lib/pages/server';

async function recursiveRebuild (pageId: string): Promise<true> {
  await setupPermissionsAfterPageRepositioned(pageId);

  const children = await resolveChildPages(pageId, true);

  await Promise.all(children.map(childPage => {
    return recursiveRebuild(childPage.id);
  }));

  return true;

}

/**
 * We will load root pages and traverse their respective trees
 * @param cursor
 */
async function inheritPermissions (cursor?: string, processed = 0, total = 0): Promise<true> {

  // Only runs first time
  if (total === 0) {
    total = await prisma.page.count({
      where: {
        parentId: null
      }
    });
  }

  const foundPages = await prisma.page.findMany({
    take: 5,
    skip: cursor ? 1 : undefined,
    cursor: cursor ? {
      id: cursor
    } : undefined,
    where: {
      parentId: null
    }
  });

  if (foundPages.length === 0) {
    return true;
  }

  console.log('Processing page tree ', processed + 1, '-', processed + foundPages.length, ' / ', total);

  await Promise.all(foundPages.map(page => {

    return recursiveRebuild(page.id);
  }));

  return inheritPermissions(foundPages[foundPages.length - 1].id, processed + foundPages.length, total);

}

/* Testing utility to delete all inheritance relationships
prisma.pagePermission.updateMany({
  data: {
    inheritedFromPermission: null
  }
}).then(() => {
  console.log('Inheritance deleted');
});
*/

/* Run this function
inheritPermissions()
  .then(() => {
    console.log('Success');
  });
*/
