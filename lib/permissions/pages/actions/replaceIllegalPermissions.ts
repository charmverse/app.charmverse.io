import type { PagePermission, Prisma } from '@prisma/client';

import type { OptionalTransaction, TransactionClient } from 'db';
import { prisma } from 'db';
import log from 'lib/log';
import type {
  IPageWithPermissions,
  PageMeta,
  PageNodeWithChildren,
  PageNodeWithPermissions,
  TargetPageTree
} from 'lib/pages/interfaces';
import { flattenTree } from 'lib/pages/mapPageTree';
import { getPage } from 'lib/pages/server';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
import { isTruthy } from 'lib/utilities/types';

import type { IPagePermissionWithSource } from '../page-permission-interfaces';

import { findExistingPermissionForGroup } from './find-existing-permission-for-group';
import { hasSameOrMorePermissions } from './has-same-or-more-permissions';

/**
 * Detects permissions to replace and emits the updateMany arguments for a Prisma transaction
 */
export function generateReplaceIllegalPermissions({ parents, targetPage }: TargetPageTree<PageNodeWithPermissions>): {
  updateManyOperations: Prisma.PagePermissionUpdateManyArgs[];
} {
  // List of parents with index from closest to furthest
  const parentMap = parents.reduce<Record<string, number>>((acc, parent, index) => {
    acc[parent.id] = index;
    return acc;
  }, {});

  const pageWithParents = [targetPage, ...parents];

  const flatTargetPageChildrenIds = flattenTree(targetPage).map((page) => page.id);

  // Permissions that were inheriting from outside the tree
  const permissionUpdates: Prisma.PagePermissionUpdateManyArgs[] = [];

  // Iterate through the page permissions to detect permissions that inherit from outside the tree
  targetPage.permissions.forEach((permission) => {
    const sourcePermission = permission.sourcePermission;

    // This source permission originates from outside the tree.
    if (sourcePermission && typeof parentMap[sourcePermission.pageId] !== 'number') {
      // This permission should now be authority for its child pages
      let newSourcePermission = permission;

      // We need to refresh permission, so we need to find the closest parent that has the same permission
      for (const parent of parents) {
        const matchingPermission = findExistingPermissionForGroup(permission, parent.permissions, false) as
          | IPagePermissionWithSource
          | undefined;
        if (matchingPermission && hasSameOrMorePermissions(parent.permissions, targetPage.permissions)) {
          newSourcePermission = matchingPermission;
        } else {
          break;
        }
      }

      permissionUpdates.push({
        where: {
          id: newSourcePermission.id
        },
        data: {
          inheritedFromPermission: null
        }
      });

      const targetPageIds = [...flatTargetPageChildrenIds];

      for (const page of pageWithParents) {
        if (page.id !== newSourcePermission.pageId) {
          targetPageIds.push(page.id);
        } else {
          break;
        }
      }

      if (targetPageIds.length > 0) {
        permissionUpdates.push({
          where: {
            pageId: {
              in: targetPageIds
            }
          },
          data: {
            inheritedFromPermission: newSourcePermission.id
          }
        });
      }
    }
  });

  return {
    updateManyOperations: permissionUpdates
  };
}

export async function replaceIllegalPermissions({
  pageId,
  tx
}: { pageId: string } & OptionalTransaction): Promise<
  IPageWithPermissions &
    PageNodeWithChildren<PageNodeWithPermissions> & { tree: TargetPageTree<PageNodeWithPermissions> }
> {
  if (!tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(tx);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function txHandler(tx: TransactionClient) {
    const { parents, targetPage } = await resolvePageTree({ pageId, tx });

    const args = generateReplaceIllegalPermissions({ parents, targetPage });

    for (const op of args.updateManyOperations) {
      await tx.pagePermission.updateMany(op);
    }

    const pageAfterPermissionsUpdate = await getPage(pageId, undefined, tx);
    if (!pageAfterPermissionsUpdate) {
      throw new Error(`Could not find page after updating permissions: ${pageId}`);
    }

    const { parents: newParents, targetPage: newTargetPage } = await resolvePageTree({
      pageId,
      tx
    });

    const pageWithChildren: IPageWithPermissions &
      PageNodeWithChildren<PageNodeWithPermissions> & { tree: TargetPageTree<PageNodeWithPermissions> } = {
      ...pageAfterPermissionsUpdate,
      children: targetPage.children,
      tree: {
        parents: newParents,
        targetPage: newTargetPage
      }
    };

    return pageWithChildren;
  }
}
