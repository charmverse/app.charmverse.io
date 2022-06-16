import { prisma } from 'db';
import { v4 as uuid } from 'uuid';

async function createDefaultPageSpacePermissions (): Promise<any> {
  const pages = await prisma.page.findMany({
    include: {
      permissions: {
        where: {
          spaceId: {
            not: null
          }
        }
      }
    }
  });

  const pagesToAddPermissionsFor = pages.filter(page => {
    return page.permissions.find(permission => {
      return permission.spaceId === page.spaceId;
    }) === undefined;
  });

  await Promise.all(pagesToAddPermissionsFor.map(page => {
    return prisma.pagePermission.create({
      data: {
        spaceId: page.spaceId,
        pageId: page.id,
        permissionLevel: 'full_access'
      }
    });
  }));

  // console.log('Created permissions for ', pagesToAddPermissionsFor.length, '/', pages.length, ' pages');

  return true;

}

/*
createDefaultPageSpacePermissions()
  .then(() => {
    console.log('Success!');
  });
*/
