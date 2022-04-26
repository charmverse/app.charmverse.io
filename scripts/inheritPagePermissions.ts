import { prisma } from 'db';
import { setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages/triggers';
import { IPageWithPermissions, resolveChildPages } from '../lib/pages/server';

async function recursiveRebuild (pageId: string | IPageWithPermissions, level = 0, sourcePageNumber = 0): Promise<true> {
  await setupPermissionsAfterPageRepositioned(pageId);

  const idToPass = typeof pageId === 'string' ? pageId : pageId.id;

  const children = await resolveChildPages(idToPass, true);

  const parallelFactor = 5;

  for (let i = 0; i < children.length; i += parallelFactor) {
    await Promise.all(children.slice(i, i + parallelFactor).map((child, childIndex) => {
      console.log(`Processing root ${sourcePageNumber}, level ${level}, child ${i + childIndex + 1}`);
      return recursiveRebuild(child, level + 1, sourcePageNumber);
    }));
  }

  return true;

}

/**
 * We will load root pages and traverse their respective trees
 * @param cursor
 */
async function inheritPermissions (processed = 0, total = 0): Promise<true> {

  // Only runs first time
  if (total === 0) {
    total = await prisma.page.count({
      where: {
        parentId: null
      }
    });
  }

  const foundPages = await prisma.page.findMany({
    take: 3,
    skip: processed,
    where: {
      parentId: null
    },
    orderBy: {
      id: 'asc'
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  if (foundPages.length === 0) {
    return true;
  }

  console.log('Processing page tree ', processed + 1, '-', processed + foundPages.length, ' / ', total);

  await Promise.all(foundPages.map((page, index) => {

    return recursiveRebuild(page, 0, processed + index + 1);
  }));

  return inheritPermissions(processed + foundPages.length, total);

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
prisma.$connect()
  .then(() => {
    console.log('Connected to DB');
    inheritPermissions(264)
      .then(() => {
        console.log('Success');
      });
  });

*/
