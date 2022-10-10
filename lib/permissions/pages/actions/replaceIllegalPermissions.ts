import type { PagePermission, Prisma } from '@prisma/client';

import type { OptionalTransaction, Transaction, TransactionClient } from 'db';
import { prisma } from 'db';
import type { IPageWithPermissions, PageNodeWithChildren, PageNodeWithPermissions, TargetPageTree } from 'lib/pages/interfaces';
import { TargetPageTreeWithFlatChildren } from 'lib/pages/interfaces';
import { flattenTree } from 'lib/pages/mapPageTree';
import { getPage } from 'lib/pages/server';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
import { isTruthy } from 'lib/utilities/types';

import { findExistingPermissionForGroup } from './find-existing-permission-for-group';
import { hasSameOrMorePermissions } from './has-same-or-more-permissions';

/**
 * Detects permissions to replace and emits the updateMany arguments for a Prisma transaction
 */
export function generateReplaceIllegalPermissions ({ parents, targetPage }: TargetPageTree<PageNodeWithPermissions>):
 { updateManyOperations:Prisma.PagePermissionUpdateManyArgs[] } {

  const parentMap = parents.reduce((acc, parent, index) => {
    acc[parent.id] = index;
    return acc;
  }, {} as Record<string, number>);

  const illegalPermissionMap: Record<string, PagePermission> = {};

  targetPage.permissions.forEach(permission => {
    const isInherited = isTruthy(permission.sourcePermission);

    if (isInherited && !parentMap[(permission.sourcePermission as PagePermission).pageId]) {
      illegalPermissionMap[permission.inheritedFromPermission as string] = permission.sourcePermission as PagePermission;
    }
  });

  const illegalPermissionIds: string[] = Object.keys(illegalPermissionMap);

  if (illegalPermissionIds.length === 0) {
    return {
      updateManyOperations: []
    };
  }

  // Page permissions which should become new source permissions
  const pagePermissionsToDisconnect: Prisma.Enumerable<Prisma.PagePermissionWhereInput> = [];

  // Permission inheritance references to update
  const oldNewMap: { oldSourcePermissionId: string, newSourcePermissionId: string }[] = [];

  /**
   * 1. Go up the tree to find where we went wrong
   * 2. Disconnect the top most illegal inheritor
   * 3. Update all children of that inheritor to inherit from the inheritor
   */
  for (const illegalPermissionRef of illegalPermissionIds) {

    const illegalSourcePagePermission = illegalPermissionMap[illegalPermissionRef];

    // No parents detected
    if (parents.length === 0) {

      const contaminatedTargetPagePermission = targetPage.permissions.find(p => p.inheritedFromPermission === illegalPermissionRef) as PagePermission;

      pagePermissionsToDisconnect.push({
        id: targetPage.permissions.find(p => p.inheritedFromPermission === illegalPermissionRef)?.id
      });

      oldNewMap.push({
        oldSourcePermissionId: illegalPermissionRef,
        newSourcePermissionId: contaminatedTargetPagePermission.id
      });

      // Exceptionally adding a continue statement as the following nested for loop is quite long
      // eslint-disable-next-line no-continue
      continue;
    }

    // We should stop this loop once we cannot find anymore refs
    for (let i = 0; i < parents.length; i++) {
      const parent = parents[i];
      const matchingIllegalPermission = parent.permissions.find(permission => permission.inheritedFromPermission === illegalPermissionRef);

      // Only the target page has an illegal permission. Parents were not contaminated
      if (i === 0 && !matchingIllegalPermission) {

        const canInherit = hasSameOrMorePermissions(parent.permissions, targetPage.permissions);

        // Make sure the parent will have a permission to inherit from
        // This logic was added to deal with an edge case where a page had an extra permission from an old parent which became a sibling, and the parent did not have this permission
        const newParentPermissionRef = findExistingPermissionForGroup(illegalSourcePagePermission, parent.permissions) as PagePermission;

        if (canInherit && newParentPermissionRef) {

          oldNewMap.push({
            oldSourcePermissionId: illegalPermissionRef,
            newSourcePermissionId: newParentPermissionRef.id
          });

        }
        else {
          pagePermissionsToDisconnect.push({
            pageId: targetPage.id,
            inheritedFromPermission: illegalPermissionRef
          });
          const newPermissionRef = findExistingPermissionForGroup(illegalSourcePagePermission, targetPage.permissions) as PagePermission;
          oldNewMap.push({
            oldSourcePermissionId: illegalPermissionRef,
            newSourcePermissionId: newPermissionRef.id as string
          });
        }

        break;
      }
      // The current item does not contain the illegal reference, so we can stop at the previous item
      else if (!matchingIllegalPermission) {
        const previousParent = parents[i - 1];
        // Inheritance check goes here
        const canInherit = hasSameOrMorePermissions(parent.permissions, previousParent.permissions);

        if (canInherit) {

          // Find the new source permission
          const newPermissionRef = findExistingPermissionForGroup(illegalSourcePagePermission, parent.permissions) as PagePermission;

          oldNewMap.push({
            oldSourcePermissionId: illegalPermissionRef,
            newSourcePermissionId: newPermissionRef.id
          });
        }
        else {
          pagePermissionsToDisconnect.push({
            pageId: previousParent.id,
            inheritedFromPermission: illegalPermissionRef
          });
          const newPermissionRef = findExistingPermissionForGroup(illegalSourcePagePermission, previousParent.permissions) as PagePermission;
          oldNewMap.push({
            oldSourcePermissionId: illegalPermissionRef,
            newSourcePermissionId: newPermissionRef.id as string
          });
        }

        break;
      }
      // We reached the top, and all parents are inheriting a bad permission. Disconnect the top parent and make it the root
      else if (i === parents.length - 1) {
        pagePermissionsToDisconnect.push({
          pageId: parent.id,
          inheritedFromPermission: illegalPermissionRef
        });
        const newPermissionRef = findExistingPermissionForGroup(illegalSourcePagePermission, parent.permissions) as PagePermission;
        oldNewMap.push({
          oldSourcePermissionId: illegalPermissionRef,
          newSourcePermissionId: newPermissionRef.id as string
        });
      }
    }

  }

  // Generate instructions for permissions that should become source permission
  const prismaDisconnectArgs: Prisma.PagePermissionUpdateManyArgs = {
    where: {
      OR: pagePermissionsToDisconnect
    },
    data: {
      inheritedFromPermission: null
    }
  };

  // We can include all parents in the updateMany, since disconnect will be run prior
  const pagesToUpdate: Prisma.PagePermissionWhereInput[] = [...flattenTree(targetPage), targetPage, ...parents].map(page => {
    return {
      pageId: page.id
    };
  });

  const prismaRefreshedInheritanceArgs: Prisma.PagePermissionUpdateManyArgs[] = oldNewMap.map(({ oldSourcePermissionId, newSourcePermissionId }) => {
    return {
      where: {
        AND: [
          {
            inheritedFromPermission: oldSourcePermissionId
          },
          {
            OR: pagesToUpdate
          }
        ]
      },
      data: {
        inheritedFromPermission: newSourcePermissionId
      }
    };
  });

  // Construct this manually so we don't accidentally emit an updateMany with an empty where clause
  const updateManyOperations: Prisma.PagePermissionUpdateManyArgs[] = [];

  if (pagePermissionsToDisconnect.length > 0) {
    updateManyOperations.push(prismaDisconnectArgs);
  }

  if (pagesToUpdate.length > 0) {
    updateManyOperations.push(...prismaRefreshedInheritanceArgs);
  }

  return {
    updateManyOperations
  };
}

export async function replaceIllegalPermissions ({ pageId, tx }: { pageId: string } & OptionalTransaction):
 Promise<IPageWithPermissions & PageNodeWithChildren<PageNodeWithPermissions> & { tree: TargetPageTree<PageNodeWithPermissions> }> {

  if (!tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(tx);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function txHandler (tx: TransactionClient) {
    const { parents, targetPage } = await resolvePageTree({ pageId, tx });

    const args = generateReplaceIllegalPermissions({ parents, targetPage });

    for (const op of args.updateManyOperations) {
      await tx.pagePermission.updateMany(op);
    }

    const pageAfterPermissionsUpdate = await getPage(pageId, undefined, tx) as IPageWithPermissions;

    const { parents: newParents, targetPage: newTargetPage } = await resolvePageTree({ pageId, tx });

    const pageWithChildren: IPageWithPermissions
    & PageNodeWithChildren<PageNodeWithPermissions>
    & { tree: TargetPageTree<PageNodeWithPermissions> } = {
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
