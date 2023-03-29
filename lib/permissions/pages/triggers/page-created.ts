import type { Space } from '@prisma/client';

import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage, PageNotFoundError } from 'lib/pages/server';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';

import { copyAllPagePermissions } from '../actions/copyPermission';
import { generateReplaceIllegalPermissions } from '../actions/replaceIllegalPermissions';
import { upsertPermission } from '../actions/upsert-permission';

export async function setupPermissionsAfterPageCreated(pageId: string): Promise<IPageWithPermissions> {
  // connect to page node from use pages (Removing iPageWithPermissions)
  return prisma.$transaction(async (tx) => {
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
      const space = await tx.space.findUnique({
        where: {
          id: page.spaceId
        },
        select: {
          defaultPagePermissionGroup: true,
          defaultPublicPages: true
        }
      });

      const permissionLevel = space?.defaultPagePermissionGroup || 'full_access';

      await upsertPermission(
        pageId,
        {
          permissionLevel,
          spaceId: page.spaceId
        },
        undefined,
        tx
      );

      if (space?.defaultPublicPages) {
        await upsertPermission(
          pageId,
          {
            permissionLevel: 'view',
            public: true
          },
          undefined,
          tx
        );
      }
    } else {
      const parent = await prisma.page.findUnique({
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
        return setupPermissionsAfterPageCreated(pageId);
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
    await upsertPermission(
      page.id,
      {
        permissionLevel: 'full_access',
        userId: page.createdBy
      },
      undefined,
      tx
    );

    const pageWithPermissions = (await getPage(page.id, undefined, tx)) as IPageWithPermissions;

    return pageWithPermissions;
  });
}
