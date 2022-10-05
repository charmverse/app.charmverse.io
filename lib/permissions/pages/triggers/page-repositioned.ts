import type { TransactionClient } from 'db';
import { prisma } from 'db';
import { flattenTree } from 'lib/pages/mapPageTree';
import type { IPageWithPermissions, PageNodeWithPermissions, TargetPageTreeWithFlatChildren } from 'lib/pages/server';
import { getPage, PageNotFoundError } from 'lib/pages/server';

import { findExistingPermissionForGroup, hasSameOrMorePermissions, replaceIllegalPermissions, upsertPermission } from '../actions';

/**
 * When updating the position of a page within the space page tree, call this function immediately afterwards
 *
 * @abstract This function used to implement alot more. It has been left as a wrapper around the newly provided replaceIllegalPermissions to keep the codebase clean, and allow for additional changes to behaviour in future
 */
export async function setupPermissionsAfterPageRepositioned (pageId: string | IPageWithPermissions, tx?: TransactionClient)
: Promise<IPageWithPermissions> {

  if (!tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(tx);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function txHandler (tx: TransactionClient) {
    const page = typeof pageId === 'string' ? await tx.page.findUnique({
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

    const updatedPage = await replaceIllegalPermissions({ pageId: page.id, tx });

    if (updatedPage.parentId) {
      const parent = await tx.page.findUnique({
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
          const matchingGroupPermission = findExistingPermissionForGroup(p, updatedPage.permissions, true);

          return matchingGroupPermission?.permissionLevel === p.permissionLevel;
        });
        if (permissionsToCopy.length > 0) {

          const treeWithChildren: TargetPageTreeWithFlatChildren<PageNodeWithPermissions> = {
            parents: updatedPage.tree.parents,
            targetPage: updatedPage.tree.targetPage,
            flatChildren: flattenTree(updatedPage.tree.targetPage)
          };

          await Promise.all(permissionsToCopy.map(p => upsertPermission(updatedPage.id, p, treeWithChildren, tx)));
        }
      }

    }

    return getPage(updatedPage.id, undefined, tx) as Promise<IPageWithPermissions>;
  }

}
