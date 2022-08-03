import { Prisma } from '@prisma/client';
import { prisma } from 'db';

export type ChildModificationAction = 'delete' | 'restore' | 'archive'

export async function modifyChildPages (parentId: string, userId: string, action: ChildModificationAction) {
  const modifiedChildPageIds: string[] = [];
  let childPageIds = [parentId];

  while (childPageIds.length !== 0) {
    modifiedChildPageIds.push(...childPageIds);
    childPageIds = (await prisma.page.findMany({
      where: {
        deletedAt: (action === 'restore' || action === 'delete') ? {
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

  if (action === 'delete') {
    await prisma.bounty.deleteMany({
      where: {
        page: {
          id: {
            in: modifiedChildPageIds
          }
        }
      }
    });

    await prisma.page.deleteMany({
      where: {
        id: {
          in: modifiedChildPageIds
        }
      }
    });

    await prisma.block.deleteMany({
      where: {
        OR: [{
          id: {
            in: modifiedChildPageIds
          },
          parentId: {
            in: modifiedChildPageIds
          }
        }]
      }
    });
  }
  else {
    const data: Prisma.PageUncheckedUpdateManyInput = {};
    if (action === 'restore') {
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
          in: modifiedChildPageIds
        }
      },
      data: data as Prisma.PageUncheckedUpdateManyInput
    });

    await prisma.block.updateMany({
      where: {
        OR: [
          {
            id: {
              in: modifiedChildPageIds
            }
          },
          {
            parentId: {
              in: modifiedChildPageIds
            }
          }
        ]
      },
      data: data as Prisma.BlockUncheckedUpdateManyInput
    });
  }

  return modifiedChildPageIds;
}
