import { prisma } from 'db';
import { setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages/triggers';
import { IPageWithPermissions } from 'lib/pages/server';

export async function queryBoard (pageId: string): Promise<true> {
  const root = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      createdAt: true,
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  const cards = (await prisma.page.findMany({
    where: {
      parentId: pageId
    },
    select: {
      id: true,
      createdAt: true,
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  })).map(item => item.permissions);

  // console.log('\r\n\r\n---Root', root!.permissions);
  // console.log('Cards', cards);

  return true;
}

/*
queryBoard('uid-here')
  .then(() => {
    console.log('Done');
  });
*/
