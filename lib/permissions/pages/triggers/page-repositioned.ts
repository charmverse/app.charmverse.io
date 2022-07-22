import { prisma } from 'db';
import { flattenTree } from 'lib/pages/mapPageTree';
import { getPage, IPageWithPermissions, PageNodeWithPermissions, PageNotFoundError, TargetPageTreeWithFlatChildren } from 'lib/pages/server';
import { findExistingPermissionForGroup, hasSameOrMorePermissions, replaceIllegalPermissions, upsertPermission } from '../actions';

/**
 * When updating the position of a page within the space page tree, call this function immediately afterwards
 *
 * @abstract This function used to implement alot more. It has been left as a wrapper around the newly provided replaceIllegalPermissions to keep the codebase clean, and allow for additional changes to behaviour in future
 */
export async function setupPermissionsAfterPageRepositioned (pageId: string | IPageWithPermissions): Promise<IPageWithPermissions> {
  const page = typeof pageId === 'string' ? await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      parentId: true,
      permissions: true
    }
  }) : pageId;

  if (!page) {
    throw new PageNotFoundError(pageId as string);
  }

  const updatedPage = await replaceIllegalPermissions({ pageId: page.id });

  if (updatedPage.parentId) {
    const parent = await prisma.page.findUnique({
      where: {
        id: updatedPage.parentId
      },
      select: {
        id: true,
        permissions: {
          include: {
            sourcePermission: true
          }
        }
      }
    });

    if (parent && hasSameOrMorePermissions(parent.permissions, updatedPage.permissions)) {
      const permissionsToCopy = parent.permissions.filter(p => {
        const matchingGroupPermission = findExistingPermissionForGroup(p, updatedPage.permissions);

        return matchingGroupPermission?.permissionLevel === p.permissionLevel;
      });
      if (permissionsToCopy.length > 0) {

        const treeWithChildren: TargetPageTreeWithFlatChildren<PageNodeWithPermissions> = {
          parents: updatedPage.tree.parents,
          targetPage: updatedPage.tree.targetPage,
          flatChildren: flattenTree(updatedPage.tree.targetPage)
        };

        await Promise.all(permissionsToCopy.map(p => upsertPermission(updatedPage.id, p, treeWithChildren)));
      }
    }

  }

  return getPage(updatedPage.id) as Promise<IPageWithPermissions>;

}
