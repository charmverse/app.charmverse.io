import { Prisma } from '@prisma/client';
import { prisma } from 'db';

interface Options {
  deletePermanently?: boolean
  restore?: boolean
}

export async function deleteNestedChild (parentId: string, userId: string, options?: Options) {
  const deletedChildPageIds: string[] = [];
  let childPageIds = [parentId];
  options = options ?? {};
  const { deletePermanently = false, restore = false } = options;

  while (childPageIds.length !== 0) {
    deletedChildPageIds.push(...childPageIds);
    childPageIds = (await prisma.page.findMany({
      where: {
        deletedAt: (deletePermanently || restore) ? {
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
    const data: Prisma.PageUncheckedUpdateManyInput = {};
    if (restore) {
      data.deletedAt = null;
    }
    else {
      data.deletedAt = new Date();
    }
    data.updatedAt = new Date();
    data.updatedBy = userId;

    await prisma.page.updateMany({
      where: {
        id: {
          in: deletedChildPageIds
        }
      },
      data: data as Prisma.PageUncheckedUpdateManyInput
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
      data: data as Prisma.BlockUncheckedUpdateManyInput
    });
  }

  return deletedChildPageIds;
}
