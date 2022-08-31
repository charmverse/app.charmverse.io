import { Space } from '@prisma/client';
import { prisma } from 'db';
import { getPage, IPageWithPermissions, PageNotFoundError } from 'lib/pages/server';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
import { copyAllPagePermissions } from '../actions/copyPermission';
import { generateReplaceIllegalPermissions } from '../actions/replaceIllegalPermissions';
import { upsertPermission } from '../actions/upsert-permission';

export async function setupPermissionsAfterPageCreated (pageId: string): Promise<IPageWithPermissions> {
  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  // This is a root page, so we can go ahead
  if (!page.parentId) {
    // Space id could be null
    if (page.spaceId) {
      const space = await prisma.space.findUnique({
        where: {
          id: page.spaceId
        },
        select: {
          defaultPagePermissionGroup: true,
          defaultPublicPages: true
        }
      }) as Space;
      if (space?.defaultPagePermissionGroup) {
        await upsertPermission(pageId, {
          permissionLevel: space.defaultPagePermissionGroup,
          spaceId: page.spaceId
        });
      }
      else {
        await upsertPermission(
          pageId,
          {
            permissionLevel: 'full_access',
            spaceId: page.spaceId
          }
        );
      }

      if (space.defaultPublicPages) {
        await upsertPermission(pageId, {
          permissionLevel: 'view',
          public: true
        });
      }
    }
    else {
      await upsertPermission(
        pageId,
        {
          permissionLevel: 'full_access',
          spaceId: page.spaceId
        }
      );
    }
  }
  else {
    const parent = (await getPage(page.parentId) as IPageWithPermissions);

    if (!parent) {
      await prisma.page.update({
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

    const tree = await resolvePageTree({ pageId: parent.id });

    const { updateManyOperations: illegalPermissionReplaceOperations } = generateReplaceIllegalPermissions(tree);

    await prisma.$transaction(async () => {
      for (const op of illegalPermissionReplaceOperations) {
        await prisma.pagePermission.updateMany(op);
      }
      const refreshedParent = await getPage(parent.id) as IPageWithPermissions;
      await prisma.pagePermission.createMany(
        copyAllPagePermissions({
          inheritFrom: true,
          newPageId: pageId,
          permissions: refreshedParent.permissions
        })
      );

    });
  }

  // Add a full access permission for the creating user
  await upsertPermission(page.id, {
    permissionLevel: 'full_access',
    userId: page.createdBy
  });

  const pageWithPermissions = await getPage(page.id) as IPageWithPermissions;

  return pageWithPermissions;
}
