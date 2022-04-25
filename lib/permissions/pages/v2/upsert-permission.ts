import { Page, PagePermission, PagePermissionLevel, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { getPage, IPageWithPermissions, PageNotFoundError, resolveChildPages, resolveParentPages } from 'lib/pages';
import { isTruthy } from 'lib/utilities/types';
import { CannotInheritOutsideTreeError, CircularPermissionError, InvalidPermissionGranteeError, InvalidPermissionLevelError, PermissionNotFoundError, SelfInheritancePermissionError } from '../errors';
import { IPagePermissionToCreate, IPagePermissionToInherit, IPagePermissionWithAssignee, IPagePermissionWithSource } from '../page-permission-interfaces';
import { permissionLevels } from '../page-permission-mapping';

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

  const matchingPermission = parent.permissions.find(parentPermission => {

    if (parentPermission.permissionLevel !== permission.permissionLevel) {
      return false;
    }

    if (permission.userId) {
      return permission.userId === parentPermission.userId;
    }

    if (permission.roleId) {
      return permission.roleId === parentPermission.roleId;
    }

    if (permission.spaceId) {
      return permission.spaceId === parentPermission.spaceId;
    }

    return false;
  });

  if (!matchingPermission) {
    return null;
  }

  return matchingPermission.inheritedFromPermission ?? matchingPermission.id;
}

function generatePrismaUpsertArgs (
  pageId: string,
  permission: IPagePermissionToCreate,
  inheritedFromPermissionId?: string
): Prisma.PagePermissionUpsertArgs {
  return {
    where: {
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
    },
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

  // Get the source permission we are inheriting from

  let permissionData: Prisma.PagePermissionUpsertArgs;

  if (typeof permission === 'string') {
    const sourcePermission = await getSourcePermission(permission);

    await validateInheritanceRelationship(sourcePermission.id, pageId);

    // Prevents propagation of a wrongly added permission in the database
    validatePermissionToCreate(sourcePermission);

    permissionData = generatePrismaUpsertArgs(pageId, sourcePermission, sourcePermission.id);
  }
  else {
    const parentPermissionId = await checkParentForSamePermission(pageId, permission);
    if (parentPermissionId) {
      return upsertPermission(pageId, parentPermissionId);
    }
    validatePermissionToCreate(permission);

    permissionData = generatePrismaUpsertArgs(pageId, permission);

  }

  const upsertedPermission = await prisma.pagePermission.upsert(permissionData);

  return upsertedPermission as IPagePermissionWithSource;

}
