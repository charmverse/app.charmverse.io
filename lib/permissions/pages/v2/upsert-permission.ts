import { Page, PagePermission, PagePermissionLevel, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { getPage, IPageWithPermissions, PageNotFoundError, resolveChildPages, resolveChildPagesAsFlatList, resolveParentPages } from 'lib/pages';
import { isTruthy } from 'lib/utilities/types';
import { CannotInheritOutsideTreeError, CircularPermissionError, InvalidPermissionGranteeError, InvalidPermissionLevelError, PermissionNotFoundError, SelfInheritancePermissionError } from '../errors';
import { IPagePermissionToCreate, IPagePermissionToInherit, IPagePermissionWithAssignee, IPagePermissionWithSource } from '../page-permission-interfaces';
import { permissionLevels } from '../page-permission-mapping';
import { findExistingPermissionForGroup } from './find-existing-permission-for-group';

/**
 * Ensures that an inheritance reference will always return the source permission
 * @param permissionId
 * @returns
 */
async function getSourcePermission (permissionId: string): Promise<PagePermission> {
  const permission = await prisma.pagePermission.findUnique({
    where: {
      id: permissionId
    }
  });

  if (!permission) {
    throw new PermissionNotFoundError(permissionId);
  }

  if (permission.inheritedFromPermission) {
    return getSourcePermission(permission.inheritedFromPermission);
  }

  return permission;
}

/**
 * Check if the parent page has a permission with the same access level as the one we are assigning. If so, return permission ID to inherit from
 * @param page
 * @param permission
 */
async function checkParentForSamePermission (pageId: string, permission: IPagePermissionToCreate): Promise<string | null> {

  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  if (!page.parentId) {
    return null;
  }

  const parent = await getPage(page.parentId);

  if (!parent) {
    return null;
  }

  const matchingPermission = findExistingPermissionForGroup(permission, parent.permissions);

  if (!matchingPermission) {
    return null;
  }

  return matchingPermission.inheritedFromPermission ?? matchingPermission.id;
}

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
      }
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

async function validateInheritanceRelationship (permissionIdToInheritFrom: string, targetPageId: string): Promise<true> {

  const [sourcePermission, parentPages] = await Promise.all([
    prisma.pagePermission.findUnique({
      where: {
        id: permissionIdToInheritFrom
      },
      include: {
        sourcePermission: true
      }
    }),
    resolveParentPages(targetPageId)
  ]);

  if (!sourcePermission) {
    throw new PermissionNotFoundError(permissionIdToInheritFrom);
  }

  if (sourcePermission.pageId === targetPageId) {
    throw new SelfInheritancePermissionError();
  }

  const permissionToInheritFromBelongsToAParent = isTruthy(parentPages.find(page => page.id === sourcePermission.pageId));

  if (permissionToInheritFromBelongsToAParent === false) {
    throw new CannotInheritOutsideTreeError(sourcePermission.pageId, targetPageId);
  }

  return true;
}

function validatePermissionToCreate (permission: IPagePermissionToCreate) {
  // This in enforced by prisma. For readability, we add this condition here
  if (!permission.permissionLevel || !PagePermissionLevel[permission.permissionLevel]) {
    throw new InvalidPermissionLevelError(permission.permissionLevel);
  }

  // Ensure only one group is assigned to this permission
  if (
    (permission.userId && (permission.roleId || permission.spaceId))
    || (permission.roleId && permission.spaceId)
    || (!permission.userId && !permission.roleId && !permission.spaceId)
  ) {
    throw new InvalidPermissionGranteeError();
  }

  return true;
}

/**
 * @param pageId
 * @param permission Either the values of the permission or the ID of a permission to inherit from
 */
export async function upsertPermission (pageId: string, permission: IPagePermissionToCreate | string): Promise<IPagePermissionWithSource> {

  console.log('Received permission', permission);
  // Get the source permission we are inheriting from

  let permissionData: Prisma.PagePermissionUpsertArgs;

  // Used in a later query
  let permissionToAssign: IPagePermissionToCreate;

  if (typeof permission === 'string') {
    const sourcePermission = await getSourcePermission(permission);

    await validateInheritanceRelationship(sourcePermission.id, pageId);

    // Prevents propagation of a wrongly added permission in the database
    validatePermissionToCreate(sourcePermission);

    permissionData = generatePrismaUpsertArgs(pageId, sourcePermission, sourcePermission.id);

    permissionToAssign = sourcePermission;
  }
  else {
    const parentPermissionId = await checkParentForSamePermission(pageId, permission);
    // Ensures the inheritance relationship will only be initiated from the source permission
    if (parentPermissionId) {
      return upsertPermission(pageId, parentPermissionId);
    }
    validatePermissionToCreate(permission);

    permissionData = generatePrismaUpsertArgs(pageId, permission);
    permissionToAssign = permission;
  }

  const permissionBeforeModification = await prisma.pagePermission.findUnique(
    {
      where: generatePermissionQuery(pageId, permissionToAssign)
    }
  );

  const upsertedPermission = await prisma.pagePermission.upsert(permissionData);

  // Refresh permissions that inherit from this
  await prisma.pagePermission.updateMany({
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
  if (permissionBeforeModification && permissionBeforeModification.inheritedFromPermission && !upsertedPermission.inheritedFromPermission) {
    const childrenIds = (await resolveChildPagesAsFlatList(upsertedPermission.pageId)).map(page => {
      return {
        pageId: page.id
      };
    });

    await prisma.pagePermission.updateMany({
      where: {
        AND: [
          {
            OR: childrenIds
          },
          {
            inheritedFromPermission: permissionBeforeModification.inheritedFromPermission
          }
        ]
      },
      data: {
        permissionLevel: upsertedPermission.permissionLevel,
        permissions: upsertedPermission.permissions,
        inheritedFromPermission: upsertedPermission.id
      }
    });
  }

  return upsertedPermission as IPagePermissionWithSource;

}
