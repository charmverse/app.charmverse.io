import { prisma } from 'db';
import { Block } from '@prisma/client';

export async function deleteNestedChild (parentId: string, userId: string) {
  const deletedChildPageIds: string[] = [];
  let childPageIds = [parentId];

  while (childPageIds.length !== 0) {
    deletedChildPageIds.push(...childPageIds);
    childPageIds = (await prisma.page.findMany({
      where: {
        deletedAt: null,
        parentId: {
          in: childPageIds
        }
      },
      select: {
        id: true
      }
    })).map(childPage => childPage.id);
  }

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

  const rootBlock = await prisma.block.findUnique({
    where: {
      id: parentId
    }
  });

  return {
    deletedChildPageIds,
    rootBlock: rootBlock as Block
  };
}
