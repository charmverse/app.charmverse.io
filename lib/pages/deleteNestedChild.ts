import { prisma } from 'db';

export async function deleteNestedChild (parentId: string, userId: string, deletePermanently?: boolean) {
  const deletedChildPageIds: string[] = [];
  let childPageIds = [parentId];
  deletePermanently = deletePermanently ?? false;

  while (childPageIds.length !== 0) {
    deletedChildPageIds.push(...childPageIds);
    childPageIds = (await prisma.page.findMany({
      where: {
        deletedAt: deletePermanently ? {
          not: null
        } : null,
        parentId: {
          in: childPageIds
        }
      },
      select: {
        id: true
      }
    })).map(childPage => childPage.id);
  }

  if (deletePermanently) {
    await prisma.page.deleteMany({
      where: {
        id: {
          in: deletedChildPageIds
        }
      }
    });

    await prisma.block.deleteMany({
      where: {
        id: {
          in: deletedChildPageIds
        }
      }
    });
  }
  else {
    await prisma.page.updateMany({
      where: {
        id: {
          in: deletedChildPageIds
        }
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: userId
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
        deletedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: userId
      }
    });
  }

  return deletedChildPageIds;
}
