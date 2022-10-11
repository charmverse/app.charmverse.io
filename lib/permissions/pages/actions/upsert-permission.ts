import type { Page, Prisma } from '@prisma/client';
import { PagePermissionLevel } from '@prisma/client';

import type { OptionalTransaction, TransactionClient } from 'db';
import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/middleware';
import { flattenTree } from 'lib/pages/mapPageTree';
import type { PageNodeWithPermissions, TargetPageTreeWithFlatChildren } from 'lib/pages/server';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
import { InvalidPermissionGranteeError } from 'lib/permissions/errors';
import { InsecureOperationError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

import { CannotInheritOutsideTreeError, InvalidPermissionLevelError, PermissionNotFoundError, SelfInheritancePermissionError } from '../errors';
import type { IPagePermissionToCreate, IPagePermissionWithSource } from '../page-permission-interfaces';

import { findExistingPermissionForGroup } from './find-existing-permission-for-group';
import { hasSameOrMorePermissions } from './has-same-or-more-permissions';

// function healPageInheritanceTree({}: {pageId: string})

function generatePermissionQuery (pageId: string, permission: IPagePermissionToCreate): Prisma.PagePermissionWhereUniqueInput {
  return {
    roleId_pageId: !permission.roleId ? undefined : {
      pageId,
      roleId: permission.roleId
    },
    spaceId_pageId: !permission.spaceId ? undefined : {
      pageId,
      spaceId: permission.spaceId
    },
    userId_PageId: !permission.userId ? undefined : {
      pageId,
      userId: permission.userId
    },
    public_pageId: !permission.public ? undefined : {
      pageId,
      public: true
    }
  };
}

function generatePrismaUpsertArgs (
  pageId: string,
  permission: IPagePermissionToCreate,
  inheritedFromPermissionId?: string
): Prisma.PagePermissionUpsertArgs {
  return {
    where: generatePermissionQuery(pageId, permission),
    create: {
      permissionLevel: permission.permissionLevel,
      permissions: permission.permissions,
      sourcePermission: !inheritedFromPermissionId ? undefined : {
        connect: {
          id: inheritedFromPermissionId
        }
      },
      page: {
        connect: {
          id: pageId
        }
      },
      user: !permission.userId ? undefined : {
        connect: {
          id: permission.userId
        }
      },
      role: !permission.roleId ? undefined : {
        connect: {
          id: permission.roleId
        }
      },
      space: !permission.spaceId ? undefined : {
        connect: {
          id: permission.spaceId
        }
      },
      public: !permission.public ? undefined : true
    },
    update: {
      permissionLevel: permission.permissionLevel,
      permissions: permission.permissions ?? [],
      sourcePermission: !inheritedFromPermissionId ? {
        disconnect: true
      } : {
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
async function validateInheritanceRelationship (
  permissionIdToInheritFrom: string,
  targetPageId: string,
  resolvedPageTree: TargetPageTreeWithFlatChildren<PageNodeWithPermissions>,
  tx: TransactionClient
):
 Promise<boolean> {

  const sourcePermission = await tx.pagePermission.findUnique({
    where: {
      id: permissionIdToInheritFrom
    },
    include: {
      sourcePermission: true
    }
  });

  if (!sourcePermission) {
    throw new PermissionNotFoundError(permissionIdToInheritFrom);
  }

  if (sourcePermission.pageId === targetPageId) {
    throw new SelfInheritancePermissionError();
  }

  const parentContainingPermission = resolvedPageTree.parents.find(page => page.id === sourcePermission.pageId);

  if (!isTruthy(parentContainingPermission)) {
    throw new CannotInheritOutsideTreeError(sourcePermission.pageId, targetPageId);
  }

  const canInherit = hasSameOrMorePermissions(
    parentContainingPermission.permissions,
    [...resolvedPageTree.targetPage.permissions, sourcePermission]
  );
  return canInherit;
}

async function validatePermissionToCreate (pageId: string, permission: IPagePermissionToCreate, tx: TransactionClient) {
  // This in enforced by tx. For readability, we add this condition here
  if (!permission.permissionLevel || !PagePermissionLevel[permission.permissionLevel]) {
    throw new InvalidPermissionLevelError(permission.permissionLevel);
  }

  // Ensure only one group is assigned to this permission
  if (
    (permission.public && (permission.userId || permission.roleId || permission.spaceId))
    || (permission.userId && (permission.roleId || permission.spaceId))
    || (permission.roleId && permission.spaceId)
    || (!permission.userId && !permission.roleId && !permission.spaceId && !permission.public)
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
  }) as Pick<Page, 'spaceId'>;

  if (permission.spaceId && permission.spaceId !== pageSpaceId?.spaceId) {
    throw new InsecureOperationError('You can only create space-level page permissions for the space the page belongs to.');

  }
  else if (permission.roleId) {
    const role = await tx.role.findUnique({
      where: {
        id: permission.roleId
      },
      select: {
        spaceId: true
      }
    });
    if (role?.spaceId !== pageSpaceId?.spaceId) {
      throw new InsecureOperationError('You can only create role-level page permissions for roles belonging to the same space as the page.');
    }
  }
  else if (permission.userId) {
    const { error } = await hasAccessToSpace({
      spaceId: pageSpaceId?.spaceId as string,
      userId: permission.userId
    });

    if (error) {
      throw new InsecureOperationError('You can only create user-level page permissions for users who are members of the space the page belongs to.');
    }
  }

  return true;
}

/**
 * @param pageId
 * @param permission Either the values of the permission or the ID of a permission to inherit from
 */
export async function upsertPermission (
  pageId: string,
  permission: IPagePermissionToCreate | string,
  resolvedPageTree?: TargetPageTreeWithFlatChildren<PageNodeWithPermissions>,
  tx?: TransactionClient
): Promise<IPagePermissionWithSource> {

  if (!tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(tx);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function txHandler (tx: TransactionClient) {
  // Pre-compute this only once
    resolvedPageTree = (resolvedPageTree ?? await resolvePageTree({
      pageId,
      tx
    }).then(tree => {
      return {
        parents: tree.parents,
        targetPage: tree.targetPage,
        flatChildren: flattenTree(tree.targetPage)
      };
    })) as TargetPageTreeWithFlatChildren<PageNodeWithPermissions>;

    // Get the source permission we are inheriting from
    let permissionData: Prisma.PagePermissionUpsertArgs;

    // Used in a later query
    let permissionToAssign: IPagePermissionToCreate;

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
        throw new PermissionNotFoundError(permission);
      }

      const permissionToCopyFrom = sourcePermission.sourcePermission ?? sourcePermission;

      // Prevents propagation of a wrongly added permission in the database
      try {

        await validatePermissionToCreate(pageId, permissionToCopyFrom, tx);

        const canInherit = await validateInheritanceRelationship(permission, pageId, resolvedPageTree, tx);

        // Drop inheritance ref if we cannot inherit
        permissionData = generatePrismaUpsertArgs(pageId, sourcePermission, canInherit ? permissionToCopyFrom.id : undefined);
      }
      catch (err) {
        if (err instanceof CannotInheritOutsideTreeError) {
        // Generate the permission upsert without any inheritance
          permissionData = generatePrismaUpsertArgs(pageId, sourcePermission);
        }
        else {
          throw err;
        }
      }

      permissionToAssign = sourcePermission;
    }
    else {
      const parentPage = resolvedPageTree.parents[0];
      // Make sure there is a permission with the same group
      const parentPermission = parentPage ? findExistingPermissionForGroup(permission, parentPage.permissions) : undefined;

      // Only call inheritance path if the value is the same as the parent
      if (parentPermission && parentPermission.permissionLevel === permission.permissionLevel) {
        return upsertPermission(pageId, parentPermission.id, resolvedPageTree, tx);
      }
      await validatePermissionToCreate(pageId, permission, tx);

      permissionData = generatePrismaUpsertArgs(pageId, permission);
      permissionToAssign = permission;
    }

    const permissionBeforeModification = await tx.pagePermission.findUnique(
      {
        where: generatePermissionQuery(pageId, permissionToAssign)
      }
    );

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
        inheritedFromPermission: !upsertedPermission.inheritedFromPermission ? undefined : upsertedPermission.inheritedFromPermission
      }
    });

    // Refresh the inheritance tree if downstream permissions should now inherit from here

    // This should also self-heal existing permissions that were previously inheriting from outside the tree
    if (permissionBeforeModification && permissionBeforeModification.inheritedFromPermission !== upsertedPermission.inheritedFromPermission) {

      const childrenIds = resolvedPageTree.flatChildren.map(page => {
        return {
          pageId: page.id
        };
      });

      await tx.pagePermission.updateMany({
        where: {
          AND: [
            {
              OR: childrenIds
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
          inheritedFromPermission: upsertedPermission.inheritedFromPermission ?? upsertedPermission.id
        }
      });
    }

    return upsertedPermission as IPagePermissionWithSource;
  }

}
