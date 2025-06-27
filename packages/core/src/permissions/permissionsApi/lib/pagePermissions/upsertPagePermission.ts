import type { Prisma } from '@charmverse/core/prisma';
import { PagePermissionLevel } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InsecureOperationError } from '@packages/core/errors';
import type { TargetPageTreeWithFlatChildren, PageNodeWithPermissions } from '@packages/core/pages';
import { resolvePageTree } from '@packages/core/pages';
import type {
  AssignedPagePermission,
  PagePermissionAssignment,
  PagePermissionAssignmentByValues
} from '@packages/core/permissions';
import { hasAccessToSpace, pagePermissionGroups } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';

import { InvalidPermissionGranteeError } from '../corePermissions/errors';

import {
  CannotInheritOutsideTreeError,
  InvalidPermissionLevelError,
  PagePermissionNotFoundError,
  SelfInheritancePermissionError
} from './errors';
import { findExistingPermissionForGroup } from './utilities/find-existing-permission-for-group';
import { hasSameOrMorePermissions } from './utilities/hasSameOrMorePermissions';
import { mapPagePermissionToAssignee } from './utilities/mapPagePermissionToAssignee';

// function healPageInheritanceTree({}: {pageId: string})

function generatePermissionQuery(
  pageId: string,
  permission: PagePermissionAssignmentByValues
): Prisma.PagePermissionWhereUniqueInput {
  return {
    roleId_pageId:
      permission.assignee.group === 'role'
        ? {
            pageId,
            roleId: permission.assignee.id
          }
        : undefined,
    spaceId_pageId:
      permission.assignee.group === 'space'
        ? {
            pageId,
            spaceId: permission.assignee.id
          }
        : undefined,
    userId_PageId:
      permission.assignee.group === 'user'
        ? {
            pageId,
            userId: permission.assignee.id
          }
        : undefined,
    public_pageId:
      permission.assignee.group === 'public'
        ? {
            pageId,
            public: true
          }
        : undefined
  };
}

function generatePrismaUpsertArgs(
  pageId: string,
  permission: PagePermissionAssignmentByValues,
  inheritedFromPermissionId?: string
): Prisma.PagePermissionUpsertArgs {
  return {
    where: generatePermissionQuery(pageId, permission),
    create: {
      permissionLevel: permission.permissionLevel,
      permissions: [],
      sourcePermission: !inheritedFromPermissionId
        ? undefined
        : {
            connect: {
              id: inheritedFromPermissionId
            }
          },
      page: {
        connect: {
          id: pageId
        }
      },
      user:
        permission.assignee.group === 'user'
          ? {
              connect: {
                id: permission.assignee.id
              }
            }
          : undefined,
      role:
        permission.assignee.group === 'role'
          ? {
              connect: {
                id: permission.assignee.id
              }
            }
          : undefined,
      space:
        permission.assignee.group === 'space'
          ? {
              connect: {
                id: permission.assignee.id
              }
            }
          : undefined,
      public: permission.assignee.group === 'public' ? true : undefined
    },
    update: {
      permissionLevel: permission.permissionLevel,
      permissions: [],
      sourcePermission: !inheritedFromPermissionId
        ? {
            disconnect: true
          }
        : {
            connect: {
              id: inheritedFromPermissionId
            }
          }
    },
    include: {
      sourcePermission: true
    }
  };
}

/**
 * True if all good and inheritance can go ahead. False if we should drop the inheritance ref
 */
async function validateInheritanceRelationship(
  permissionIdToInheritFrom: string,
  targetPageId: string,
  resolvedPageTree: TargetPageTreeWithFlatChildren<PageNodeWithPermissions>,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const sourcePermission = await tx.pagePermission.findUnique({
    where: {
      id: permissionIdToInheritFrom
    },
    include: {
      sourcePermission: true
    }
  });

  if (!sourcePermission) {
    throw new PagePermissionNotFoundError(permissionIdToInheritFrom);
  }

  if (sourcePermission.pageId === targetPageId) {
    throw new SelfInheritancePermissionError();
  }
  const parentContainingPermission = resolvedPageTree.parents.find((page) => page.id === sourcePermission.pageId);

  if (!parentContainingPermission) {
    throw new CannotInheritOutsideTreeError(sourcePermission.pageId, targetPageId);
  }

  const canInherit = hasSameOrMorePermissions(parentContainingPermission.permissions, [
    ...resolvedPageTree.targetPage.permissions,
    sourcePermission
  ]);
  return canInherit;
}

async function validatePermissionToCreate(
  pageId: string,
  permission: PagePermissionAssignmentByValues,
  tx: Prisma.TransactionClient
) {
  // This in enforced by tx. For readability, we add this condition here
  if (!permission.permissionLevel || !PagePermissionLevel[permission.permissionLevel]) {
    throw new InvalidPermissionLevelError(permission.permissionLevel);
  }

  // Ensure only one group is assigned to this permission
  if (
    !pagePermissionGroups.includes(permission.assignee.group) ||
    (permission.assignee.group !== 'public' && !stringUtils.isUUID(permission.assignee.id))
  ) {
    throw new InvalidPermissionGranteeError();
  }

  // Load the page space ID
  const pageSpaceId = await tx.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

  if (permission.assignee.group === 'space' && permission.assignee.id !== pageSpaceId?.spaceId) {
    throw new InsecureOperationError(
      'You can only create space-level page permissions for the space the page belongs to.'
    );
  } else if (permission.assignee.group === 'role') {
    const role = await tx.role.findUnique({
      where: {
        id: permission.assignee.id
      },
      select: {
        spaceId: true
      }
    });
    if (role?.spaceId !== pageSpaceId?.spaceId) {
      throw new InsecureOperationError(
        'You can only create role-level page permissions for roles belonging to the same space as the page.'
      );
    }
  } else if (permission.assignee.group === 'user') {
    const { spaceRole } = await hasAccessToSpace({
      spaceId: pageSpaceId?.spaceId as string,
      userId: permission.assignee.id
    });

    if (!spaceRole) {
      throw new InsecureOperationError(
        'You can only create user-level page permissions for users who are members of the space the page belongs to.'
      );
    }
  }

  return true;
}

type AssignmentWithTransaction = PagePermissionAssignment & {
  tx?: Prisma.TransactionClient;
  resolvedPageTree?: TargetPageTreeWithFlatChildren<PageNodeWithPermissions>;
};

/**
 * @param pageId
 * @param permission Either the values of the permission or the ID of a permission to inherit from
 */
export async function upsertPagePermission({
  permission,
  pageId,
  resolvedPageTree,
  tx
}: AssignmentWithTransaction): Promise<AssignedPagePermission> {
  if (!tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(tx);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function txHandler(tx: Prisma.TransactionClient) {
    // Pre-compute this only once
    resolvedPageTree = (resolvedPageTree ??
      (await resolvePageTree({
        pageId,
        tx,
        flattenChildren: true
      }))) as TargetPageTreeWithFlatChildren<PageNodeWithPermissions>;
    // Get the source permission we are inheriting from
    let permissionData: Prisma.PagePermissionUpsertArgs;

    // Used in a later query
    let permissionToAssign: PagePermissionAssignmentByValues;

    if (typeof permission === 'string') {
      // Lookup permission in the database
      const sourcePermission = await tx.pagePermission.findUnique({
        where: {
          id: permission
        },
        include: {
          sourcePermission: true
        }
      });

      if (!sourcePermission) {
        throw new PagePermissionNotFoundError(permission);
      }

      const permissionToCopyFrom = sourcePermission.sourcePermission ?? sourcePermission;

      const mappedPermission = mapPagePermissionToAssignee({ permission: permissionToCopyFrom });
      const permissionInputValue = {
        permissionLevel: mappedPermission.permissionLevel,
        assignee: mappedPermission.assignee
      };

      // Prevents propagation of a wrongly added permission in the database
      try {
        await validatePermissionToCreate(pageId, permissionInputValue, tx);

        const canInherit = await validateInheritanceRelationship(permission, pageId, resolvedPageTree, tx);

        // Drop inheritance ref if we cannot inherit
        permissionData = generatePrismaUpsertArgs(
          pageId,
          permissionInputValue,
          canInherit ? permissionToCopyFrom.id : undefined
        );
      } catch (err) {
        if (err instanceof CannotInheritOutsideTreeError) {
          // Generate the permission upsert without any inheritance
          permissionData = generatePrismaUpsertArgs(pageId, permissionInputValue);
        } else {
          throw err;
        }
      }

      permissionToAssign = permissionInputValue;
    } else {
      const parentPage = resolvedPageTree.parents[0];
      // Make sure there is a permission with the same group
      const parentPermission = parentPage
        ? findExistingPermissionForGroup(permission, parentPage.permissions)
        : undefined;

      // Only call inheritance path if the value is the same as the parent
      if (parentPermission && parentPermission.permissionLevel === permission.permissionLevel) {
        return upsertPagePermission({ pageId, permission: parentPermission.id, resolvedPageTree, tx });
      }
      await validatePermissionToCreate(pageId, permission, tx);

      permissionData = generatePrismaUpsertArgs(pageId, permission);
      permissionToAssign = permission;
    }

    const permissionBeforeModification = await tx.pagePermission.findUnique({
      where: generatePermissionQuery(pageId, permissionToAssign)
    });

    const upsertedPermission = await tx.pagePermission.upsert(permissionData);

    // Refresh permissions that inherit from this
    await tx.pagePermission.updateMany({
      where: {
        inheritedFromPermission: upsertedPermission.id
      },
      data: {
        permissionLevel: upsertedPermission.permissionLevel,
        permissions: upsertedPermission.permissions,
        // Refresh the downstream inheritance reference if this permission now inherits
        inheritedFromPermission: !upsertedPermission.inheritedFromPermission
          ? undefined
          : upsertedPermission.inheritedFromPermission,
        allowDiscovery: upsertedPermission.allowDiscovery
      }
    });

    // Refresh the inheritance tree if downstream permissions should now inherit from here

    // This should also self-heal existing permissions that were previously inheriting from outside the tree
    if (
      permissionBeforeModification &&
      permissionBeforeModification.inheritedFromPermission !== upsertedPermission.inheritedFromPermission
    ) {
      const childrenIds = resolvedPageTree.flatChildren.map((page) => page.id);

      await tx.pagePermission.updateMany({
        where: {
          AND: [
            {
              pageId: {
                in: childrenIds
              }
            },
            {
              inheritedFromPermission: permissionBeforeModification.inheritedFromPermission
            },
            // Avoid accidentally editing non inherited permissions
            {
              inheritedFromPermission: {
                not: null
              }
            }
          ]
        },
        data: {
          permissionLevel: upsertedPermission.permissionLevel,
          permissions: upsertedPermission.permissions,
          inheritedFromPermission: upsertedPermission.inheritedFromPermission ?? upsertedPermission.id,
          allowDiscovery: upsertedPermission.allowDiscovery
        }
      });
    }

    return mapPagePermissionToAssignee({ permission: upsertedPermission });
  }
}
