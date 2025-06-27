import type { PagePermission, Prisma } from '@charmverse/core/prisma';
import type { OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import type {
  TargetPageTree,
  PageNodeWithPermissions,
  PageWithPermissions,
  PageNodeWithChildren
} from '@packages/core/pages';
import { pageTree, resolvePageTree } from '@packages/core/pages';

import { findExistingPermissionForGroup } from './utilities/find-existing-permission-for-group';
import { hasSameOrMorePermissions } from './utilities/hasSameOrMorePermissions';
import { mapPagePermissionToAssignee } from './utilities/mapPagePermissionToAssignee';

/**
 * Detects permissions to replace and emits the updateMany arguments for a Prisma transaction
 */
export function generateReplaceIllegalPermissions({ parents, targetPage }: TargetPageTree<PageNodeWithPermissions>): {
  updateManyOperations: Prisma.PagePermissionUpdateManyArgs[];
} {
  const parentMap = parents.reduce<Record<string, number>>((acc, parent, index) => {
    acc[parent.id] = index;
    return acc;
  }, {});

  const illegalPermissionMap: Record<string, PagePermission> = {};

  targetPage.permissions.forEach((permission) => {
    const sourcePermission = permission.sourcePermission;

    if (permission.inheritedFromPermission && sourcePermission && !parentMap[sourcePermission.pageId]) {
      illegalPermissionMap[permission.inheritedFromPermission] = sourcePermission;
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
  const oldNewMap: { oldSourcePermissionId: string; newSourcePermissionId: string }[] = [];

  /**
   * 1. Go up the tree to find where we went wrong
   * 2. Disconnect the top most illegal inheritor
   * 3. Update all children of that inheritor to inherit from the inheritor
   */
  for (const illegalPermissionRef of illegalPermissionIds) {
    const illegalSourcePagePermission = illegalPermissionMap[illegalPermissionRef];

    // No parents detected
    if (parents.length === 0) {
      const contaminatedTargetPagePermission = targetPage.permissions.find(
        (p) => p.inheritedFromPermission === illegalPermissionRef
      );

      const permissionId = targetPage.permissions.find((p) => p.inheritedFromPermission === illegalPermissionRef)?.id;
      if (permissionId) {
        pagePermissionsToDisconnect.push({
          id: permissionId
        });
      } else {
        log.warn('Skip page permission to disconnect as it was not found', {
          permissions: targetPage.permissions,
          permissionId,
          illegalPermissionRef
        });
      }

      if (contaminatedTargetPagePermission) {
        oldNewMap.push({
          oldSourcePermissionId: illegalPermissionRef,
          newSourcePermissionId: contaminatedTargetPagePermission.id
        });
      }

      // Exceptionally adding a continue statement as the following nested for loop is quite long
      // eslint-disable-next-line no-continue
      continue;
    }

    // We should stop this loop once we cannot find anymore refs
    for (let i = 0; i < parents.length; i++) {
      const parent = parents[i];
      const matchingIllegalPermission = parent.permissions.find(
        (permission) => permission.inheritedFromPermission === illegalPermissionRef
      );

      // Only the target page has an illegal permission. Parents were not contaminated
      if (i === 0 && !matchingIllegalPermission) {
        const canInherit = hasSameOrMorePermissions(parent.permissions, targetPage.permissions);

        // Make sure the parent will have a permission to inherit from
        // This logic was added to deal with an edge case where a page had an extra permission from an old parent which became a sibling, and the parent did not have this permission
        const newParentPermissionRef = findExistingPermissionForGroup(
          mapPagePermissionToAssignee({ permission: illegalSourcePagePermission }),
          parent.permissions
        );

        if (canInherit && newParentPermissionRef) {
          oldNewMap.push({
            oldSourcePermissionId: illegalPermissionRef,
            newSourcePermissionId: newParentPermissionRef.id
          });
        } else {
          pagePermissionsToDisconnect.push({
            pageId: targetPage.id,
            inheritedFromPermission: illegalPermissionRef
          });
          const newPermissionRef = findExistingPermissionForGroup(
            mapPagePermissionToAssignee({ permission: illegalSourcePagePermission }),
            targetPage.permissions
          );
          if (newPermissionRef) {
            oldNewMap.push({
              oldSourcePermissionId: illegalPermissionRef,
              newSourcePermissionId: newPermissionRef.id
            });
          } else {
            log.warn('Skip page permission to disconnect as it was not found', {
              permissions: targetPage.permissions,
              permission: illegalSourcePagePermission
            });
          }
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
          const newPermissionRef = findExistingPermissionForGroup(
            mapPagePermissionToAssignee({ permission: illegalSourcePagePermission }),
            parent.permissions
          );

          if (newPermissionRef) {
            oldNewMap.push({
              oldSourcePermissionId: illegalPermissionRef,
              newSourcePermissionId: newPermissionRef.id
            });
          }
        } else {
          pagePermissionsToDisconnect.push({
            pageId: previousParent.id,
            inheritedFromPermission: illegalPermissionRef
          });
          const newPermissionRef = findExistingPermissionForGroup(
            mapPagePermissionToAssignee({ permission: illegalSourcePagePermission }),
            previousParent.permissions
          );
          if (newPermissionRef) {
            oldNewMap.push({
              oldSourcePermissionId: illegalPermissionRef,
              newSourcePermissionId: newPermissionRef.id
            });
          }
        }

        break;
      }
      // We reached the top, and all parents are inheriting a bad permission. Disconnect the top parent and make it the root
      else if (i === parents.length - 1) {
        pagePermissionsToDisconnect.push({
          pageId: parent.id,
          inheritedFromPermission: illegalPermissionRef
        });
        const newPermissionRef = findExistingPermissionForGroup(
          mapPagePermissionToAssignee({ permission: illegalSourcePagePermission }),
          parent.permissions
        );
        if (newPermissionRef) {
          oldNewMap.push({
            oldSourcePermissionId: illegalPermissionRef,
            newSourcePermissionId: newPermissionRef.id
          });
        } else {
          log.warn('Skip page permission to disconnect as it was not found', {
            permissions: parent.permissions,
            permission: illegalSourcePagePermission
          });
        }
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
  const pagesToUpdate: Prisma.PagePermissionWhereInput[] = [
    ...pageTree.flattenTree(targetPage),
    targetPage,
    ...parents
  ].map((page) => {
    return {
      pageId: page.id
    };
  });

  const prismaRefreshedInheritanceArgs: Prisma.PagePermissionUpdateManyArgs[] = oldNewMap.map(
    ({ oldSourcePermissionId, newSourcePermissionId }) => {
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
    }
  );

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

export async function replaceIllegalPermissions({
  pageId,
  tx: _tx
}: { pageId: string } & OptionalPrismaTransaction): Promise<
  PageWithPermissions &
    PageNodeWithChildren<PageNodeWithPermissions> & { tree: TargetPageTree<PageNodeWithPermissions> }
> {
  if (!_tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(_tx);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function txHandler(tx: Prisma.TransactionClient) {
    const { parents, targetPage } = await resolvePageTree({ pageId, tx });

    const args = generateReplaceIllegalPermissions({ parents, targetPage });

    for (const op of args.updateManyOperations) {
      await tx.pagePermission.updateMany(op);
    }

    const pageAfterPermissionsUpdate = await tx.page.findUnique({
      where: { id: pageId },
      include: { permissions: { include: { sourcePermission: true } } }
    });
    if (!pageAfterPermissionsUpdate) {
      throw new Error(`Could not find page after updating permissions: ${pageId}`);
    }

    const { parents: newParents, targetPage: newTargetPage } = await resolvePageTree({
      pageId,
      tx
    });

    const pageWithChildren: PageWithPermissions &
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
