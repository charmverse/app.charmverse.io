import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { resolvePageTree } from '@packages/core/pages';

type DeleteAction = 'delete' | 'restore' | 'trash';

export async function trashOrDeletePage(pageId: string, userId: string, action: DeleteAction) {
  const { flatChildren } = await resolvePageTree({
    pageId,
    flattenChildren: true,
    includeDeletedPages: true
  });

  const modifiedChildPageIds: string[] = [pageId, ...flatChildren.map((p) => p.id)];

  if (action === 'delete') {
    // Only top level page can be proposal page
    await prisma.proposal.deleteMany({
      where: {
        page: {
          id: pageId
        }
      }
    });
    await prisma.$transaction([
      prisma.bounty.deleteMany({
        where: {
          page: {
            id: {
              in: modifiedChildPageIds
            }
          }
        }
      }),
      prisma.page.deleteMany({
        where: {
          OR: [
            {
              id: {
                in: modifiedChildPageIds
              }
            },
            {
              syncWithPageId: {
                in: modifiedChildPageIds
              }
            }
          ]
        }
      }),
      prisma.block.deleteMany({
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
        }
      }),
      prisma.cardNotification.deleteMany({
        where: {
          cardId: {
            in: modifiedChildPageIds
          }
        }
      })
    ]);
  } else {
    const data: Prisma.PageUncheckedUpdateManyInput = {};
    if (action === 'restore') {
      data.deletedAt = null;
    } else {
      data.deletedAt = new Date();
    }
    data.updatedAt = new Date();
    data.updatedBy = userId;

    await prisma.page.updateMany({
      where: {
        OR: [
          {
            id: {
              in: modifiedChildPageIds
            }
          },
          {
            syncWithPageId: {
              in: modifiedChildPageIds
            }
          }
        ]
      },
      data: {
        ...data,
        deletedBy: action === 'restore' ? null : userId
      }
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
