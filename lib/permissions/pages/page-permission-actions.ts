import { PagePermission, PagePermissionLevel, Prisma, Role, Space, User } from '@prisma/client';
import { prisma } from 'db';
import { isTruthy } from 'lib/utilities/types';
import { IPageWithPermissions, getPage, PageNotFoundError, resolveChildPages, resolveParentPages } from 'lib/pages';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { CannotInheritOutsideTreeError, CircularPermissionError, InvalidPermissionGranteeError, InvalidPermissionLevelError, PermissionNotFoundError, SelfInheritancePermissionError } from './errors';
import { IPagePermissionToCreate, IPagePermissionToInherit, IPagePermissionUpdate, IPagePermissionWithAssignee, IPagePermissionWithSource } from './page-permission-interfaces';

export async function listPagePermissions (pageId: string): Promise<IPagePermissionWithAssignee []> {
  const permissions = await prisma.pagePermission.findMany({
    where: {
      pageId
    },
    include: {
      role: true,
      space: true,
      user: true,
      sourcePermission: true
    }
  });

  return permissions;
}

async function preventCircularPermissionInheritance (permissionIdToInheritFrom: string, targetPageId: string) {

  const sourcePermission = await prisma.pagePermission.findUnique({
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

  if (sourcePermission.sourcePermission?.pageId === targetPageId) {
    throw new CircularPermissionError(sourcePermission.id, sourcePermission.sourcePermission.id);
  }

}

/**
 * Creates a permission for a user, role or space, and a pageId
 * Works in upsert mode, ensuring there is always only 1 page permission per user/space/role && page pair
 * @param permission
 * @returns
 */
export async function createPagePermission (permission: IPagePermissionToCreate | IPagePermissionToInherit): Promise<IPagePermissionWithSource> {

  // Split the possible types for later use in this function
  const freshPermission = permission as IPagePermissionToCreate;
  const permissionToInheritFrom = permission as IPagePermissionToInherit;

  // Inherited from will be defined if this is an inheritable permission
  if (permissionToInheritFrom.inheritedFromPermission) {
    await preventCircularPermissionInheritance(permissionToInheritFrom.inheritedFromPermission, permissionToInheritFrom.pageId);
  // We will be creating this permission from scratch. Check it is valid
  }
  else if (
    // Trying to assign to multiple groups at once
    (freshPermission.userId && (freshPermission.roleId || freshPermission.spaceId))
    || (freshPermission.roleId && freshPermission.spaceId)
    // No group assigned
    || (!freshPermission.roleId && !freshPermission.userId && !freshPermission.spaceId)) {
    throw new InvalidPermissionGranteeError();
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const permissionData = permissionToInheritFrom.inheritedFromPermission ? (await prisma.pagePermission.findUnique({
    where: {
      id: permissionToInheritFrom.inheritedFromPermission
    }
  }))! : freshPermission;

  // We only need to store permissions in the database for the custom level.
  // For permission groups, we can simply load the template for that group when evaluating permissions
  const permissionsToAssign = permissionData.permissionLevel === 'custom' ? permissionData.permissions : [];
  const permissionLevel = permissionData.permissionLevel;

  if (!isTruthy(permissionLevel) || !isTruthy(PagePermissionLevel[permissionLevel])) {
    throw new InvalidPermissionLevelError(permissionLevel);
  }

  // Only one of the 3 below items will be defined
  const atomicUpdateQuery: Prisma.PagePermissionWhereUniqueInput = {
    userId_PageId: permissionData.userId ? {
      pageId: permission.pageId,
      userId: permissionData.userId
    } : undefined,
    roleId_pageId: permissionData.roleId ? {
      pageId: permission.pageId,
      roleId: permissionData.roleId
    } : undefined,
    spaceId_pageId: permissionData.spaceId ? {
      pageId: permission.pageId,
      spaceId: permissionData.spaceId
    } : undefined
  };

  // Load permission before it is modified
  const permissionBeforeModification = await prisma.pagePermission.findUnique({
    where: atomicUpdateQuery
  });

  const createdPermission = await prisma.pagePermission.upsert({
    where: atomicUpdateQuery,
    include: {
      sourcePermission: true
    },
    update: {
      permissionLevel,
      permissions: permissionsToAssign,
      sourcePermission: !permissionToInheritFrom.inheritedFromPermission
        ? {
          disconnect: true
        }
        : {
          connect: {
            id: permissionToInheritFrom.inheritedFromPermission
          }
        }
    },
    create: {
      permissionLevel,
      permissions: permissionsToAssign,
      page: {
        connect: {
          id: permission.pageId
        }
      },
      user: !permissionData.userId ? undefined : {
        connect: {
          id: permissionData.userId
        }
      },
      role: !permissionData.roleId ? undefined : {
        connect: {
          id: permissionData.roleId
        }
      },
      space: !permissionData.spaceId ? undefined : {
        connect: {
          id: permissionData.spaceId
        }
      },
      sourcePermission: !permissionToInheritFrom.inheritedFromPermission
        ? undefined : {
          connect: {
            id: permissionToInheritFrom.inheritedFromPermission as string
          }
        }
    }
  });

  // Update all permissions that inherit from this
  await prisma.pagePermission.updateMany({
    where: {
      inheritedFromPermission: createdPermission.id
    },
    data: {
      permissionLevel: createdPermission.permissionLevel,
      permissions: createdPermission.permissions
    }
  });

  const childPages = await resolveChildPages(createdPermission.pageId);

  // Update permissions that inherited from a parent permission
  // The new permission is now the authority as it is closer
  if (permissionBeforeModification?.inheritedFromPermission && !createdPermission.inheritedFromPermission) {
    await prisma.pagePermission.updateMany({
      where: {
        AND: [
          {
            OR: childPages.map(child => {
              return { pageId: child.id };
            })
          },
          {
            inheritedFromPermission: permissionBeforeModification.inheritedFromPermission
          }
        ]
      },
      data: {
        permissionLevel: createdPermission.permissionLevel,
        permissions: createdPermission.permissions,
        inheritedFromPermission: createdPermission.id
      }
    });
  }

  return createdPermission;
}

/**
 * Update a page permission using its ID
 */
export async function updatePagePermission (permissionId: string, permission: IPagePermissionUpdate) {
  const permissionLevel = permission.permissionLevel;

  if (!isTruthy(permissionLevel) || !isTruthy(PagePermissionLevel[permissionLevel])) {
    throw {
      error: 'Please provide a valid permission level'
    };
  }

  // We only need to store permissions in the database for the custom level.
  // For permission groups, we can simply load the template for that group when evaluating permissions
  const permissionsToAssign = permission.permissionLevel === 'custom' ? permission.permissions : [];

  const permissionUpdateContent = {
    permissionLevel: permission.permissionLevel,
    permissions: permissionsToAssign
  } as Prisma.PagePermissionUpdateInput;

  const updatedPermission = await prisma.pagePermission.update({
    where: {
      id: permissionId
    },
    data: permissionUpdateContent
  });

  return updatedPermission;
}

export async function deletePagePermission (permissionId: string) {

  if (!isTruthy(permissionId)) {
    throw {
      error: 'Please provide a valid permission ID'
    };
  }

  const foundPermission = await prisma.pagePermission.findUnique({
    where: {
      id: permissionId
    }
  });

  if (!foundPermission) {
    throw new PermissionNotFoundError(permissionId);
  }

  // Delete the permission and the permissions
  await prisma.pagePermission.deleteMany({ where: {
    OR: [
      {
        id: permissionId
      }, {
        inheritedFromPermission: permissionId
      }
    ]
  } });

  return true;
}

export async function inheritPermissions (sourcePageId: string, targetPageId: string): Promise<IPageWithPermissions> {
  const [sourcePage, targetPage] = await Promise.all([
    getPage(sourcePageId),
    getPage(targetPageId)
  ]);

  if (!sourcePage || !targetPage) {
    throw new PageNotFoundError(!sourcePage ? sourcePageId : targetPageId);
  }

  if (targetPage.parentId !== sourcePage.id) {
    const parentPages = await resolveParentPages(targetPage.id);
    // Make sure the page we want to inherit from is a prent of this page
    const isValidParent = parentPages.some(page => page.id === sourcePage.id);
    if (!isValidParent) {
      throw new CannotInheritOutsideTreeError(sourcePageId, targetPageId);
    }
  }

  const permissionsToCopy = [];

  for (const permission of sourcePage.permissions) {
    const existingPermission = targetPage.permissions.find(targetPermission => {

      if (permission.userId) {
        return targetPermission.userId === permission.userId;
      }
      else
      if (permission.roleId) {
        return targetPermission.roleId === permission.roleId;
      }
      else
      if (permission.spaceId) {
        return targetPermission.spaceId === permission.spaceId;
      }

      return false;

    });

    if (!existingPermission) {
      permissionsToCopy.push(permission);
    }
  }

  await Promise.all(permissionsToCopy.map(permission => {
    return createPagePermission({
      inheritedFromPermission: permission.id,
      pageId: targetPageId
    });
  }));

  const updatedTargetPageWithClonedPermissions = await getPage(targetPage.id) as IPageWithPermissions;

  return updatedTargetPageWithClonedPermissions;
}
