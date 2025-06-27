import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { PageNotFoundError } from '@packages/core/errors';
import type { PageMetaWithPermissions } from '@packages/core/pages';
import { resolvePageTree } from '@packages/core/pages';
import { copyAllPagePermissions } from '@packages/core/permissions';

import { getPageMetaWithPermissions } from './getPageMetaWithPermissions';
import { generateReplaceIllegalPermissions } from './replaceIllegalPermissions';
import { upsertPagePermission } from './upsertPagePermission';

export async function handlePageCreated(
  pageId: string,
  _tx?: Prisma.TransactionClient
): Promise<PageMetaWithPermissions> {
  if (!_tx) {
    return prisma.$transaction(txHandler, { timeout: 20000 });
  }

  return txHandler(_tx);

  async function txHandler(tx: Prisma.TransactionClient) {
    const page = await tx.page.findUnique({
      where: {
        id: pageId
      },
      select: {
        id: true,
        parentId: true,
        spaceId: true,
        createdBy: true
      }
    });
    if (!page) {
      throw new PageNotFoundError(pageId);
    }

    // This is a root page, so we can go ahead
    if (!page.parentId) {
      const space = await tx.space.findUniqueOrThrow({
        where: {
          id: page.spaceId
        },
        select: {
          defaultPagePermissionGroup: true,
          defaultPublicPages: true
        }
      });

      const permissionLevel = space.defaultPagePermissionGroup;

      if (permissionLevel) {
        await upsertPagePermission({
          pageId,
          permission: {
            permissionLevel,
            assignee: {
              group: 'space',
              id: page.spaceId
            }
          },
          tx
        });
      }

      if (space?.defaultPublicPages) {
        await upsertPagePermission({
          pageId,
          permission: {
            permissionLevel: 'view',
            assignee: {
              group: 'public'
            }
          },
          tx
        });
      }
    } else {
      const parent = await tx.page.findUnique({
        where: {
          id: page.parentId
        },
        select: {
          id: true
        }
      });

      if (!parent) {
        await tx.page.update({
          where: {
            id: pageId
          },
          data: {
            parentId: null
          }
        });
        // Parent was deleted, so we should drop the reference, and reinvoke this function with the page as a root page
        return handlePageCreated(pageId, tx);
      }

      // Generate a prisma transaction for the inheritance

      const tree = await resolvePageTree({ pageId: parent.id, tx });

      const { updateManyOperations: illegalPermissionReplaceOperations } = generateReplaceIllegalPermissions(tree);

      for (const op of illegalPermissionReplaceOperations) {
        await tx.pagePermission.updateMany(op);
      }
      const refreshedParent = await tx.page.findUniqueOrThrow({
        where: {
          id: parent.id
        },
        include: {
          permissions: {
            include: {
              sourcePermission: true
            }
          }
        }
      });
      const pagePermissionArgs = copyAllPagePermissions({
        inheritFrom: true,
        newPageId: pageId,
        permissions: refreshedParent.permissions
      });

      await tx.pagePermission.createMany(pagePermissionArgs);
    }

    // Add a full access permission for the creating user

    const user = await prisma.user.findUnique({
      where: {
        id: page.createdBy
      },
      select: {
        isBot: true
      }
    });

    // Don't create page permissions for pages created by a bot
    if (!user?.isBot) {
      await upsertPagePermission({
        pageId: page.id,
        permission: {
          assignee: { group: 'user', id: page.createdBy },
          permissionLevel: 'full_access'
        },
        tx
      });
    }

    const pageWithPermissions = await getPageMetaWithPermissions({ pageId: page.id, tx });

    return pageWithPermissions;
  }
}
