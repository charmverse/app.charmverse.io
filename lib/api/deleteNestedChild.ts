import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

export async function deleteNestedChild (parentId: string, userId: string) {
  const deletedChildPageIds: string[] = [];
  let childPageIds = [parentId];

  while (childPageIds.length !== 0) {
    deletedChildPageIds.push(...childPageIds);
    const _childPages = (await prisma.page.findMany({
      where: {
        deletedAt: null,
        parentId: {
          in: childPageIds
        }
      },
      select: {
        id: true,
        type: true
      }
    }));

    childPageIds = [];
    for (const _childPage of _childPages) {
      const pagePermission = await computeUserPagePermissions({
        pageId: _childPage.id,
        userId
      });

      if (pagePermission.delete || _childPage.type === 'card') {
        childPageIds.push(_childPage.id);
      }
    }
  }

  await prisma.page.updateMany({
    where: {
      id: {
        in: deletedChildPageIds
      }
    },
    data: {
      deletedAt: new Date()
    }
  });

  await prisma.block.updateMany({
    where: {
      OR: [
        {
          id: {
            in: deletedChildPageIds
          }
        },
        {
          parentId: {
            in: deletedChildPageIds
          }
        }
      ]
    },
    data: {
      deletedAt: new Date()
    }
  });

  return deletedChildPageIds;
}
