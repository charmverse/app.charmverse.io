import { prisma } from 'db';
import { setupPermissionsAfterPagePermissionAdded, setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages/triggers';
import { IPageWithPermissions, resolveChildPages } from 'lib/pages/server';
import { upsertPermission } from '../lib/permissions/pages';
import { recursiveRebuild } from './inheritPagePermissions';

const CONCURRENT = 3;

async function upsertPublicPermissions () {
  // STEP 0 - GET All current public pages
  const publicPages = await prisma.page.findMany({
    where: {
      isPublic: true
    }
  });

  console.log(`${publicPages.length} public pages found`);

  // STEP 2 - Create this permission everywhere
  for (let i = 0; i < publicPages.length; i += CONCURRENT) {
    const sliced = publicPages.slice(0, i + CONCURRENT);
    await Promise.all(sliced.map(page => {
      return new Promise(resolve => {
        upsertPermission(page.id, {
          permissionLevel: 'view',
          public: true
        }).then(created => {
          setupPermissionsAfterPagePermissionAdded(created.id)
            .then(() => {
              console.log('Job done');
              resolve(true);
            });
        });
      });

    }));
  }

  /*
  // STEP 3 - Handle inheritance
  for (let i = 0; i < publicPages.length; i += CONCURRENT) {
    console.log(`Handling pages ${i + 1} - ${i + 1 + CONCURRENT}`);
    await Promise.all(publicPages.map((page, index) => recursiveRebuild(page.id, 0, i + 1 + index)));
  }
  */

  return true;
}

// Run this function
upsertPublicPermissions()
  .then(() => {
    console.log('Job complete');
  });
