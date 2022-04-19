import { PagePermission, PagePermissionLevel, Prisma, Role, Space, User } from '@prisma/client';
import { prisma } from 'db';
import { isTruthy } from 'lib/utilities/types';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { CircularPermissionError, InvalidPermissionGranteeError, InvalidPermissionLevelError, PermissionNotFoundError, SelfInheritancePermissionError } from './errors';
import { IPagePermissionToCreate, IPagePermissionUpdate, IPagePermissionWithAssignee, IPagePermissionWithSource } from './page-permission-interfaces';
import { resolveChildPages } from './refresh-page-permission-tree';

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

async function preventCircularPermissionInheritance (permission: IPagePermissionToCreate) {
  if (permission.inheritedFromPermission) {
    const existingPermission = await prisma.pagePermission.findFirst({
      where: permission.userId ? {
        userId: permission.userId,
        pageId: permission.pageId
      } : permission.roleId ? {
        roleId: permission.roleId,
        pageId: permission.pageId
      } : {
        spaceId: permission.spaceId,
        pageId: permission.pageId
      }
    });

    if (existingPermission?.id === permission.inheritedFromPermission) {
      throw new SelfInheritancePermissionError();
    }

    if (!existingPermission) {
      return true;
    }

    const sourcePermission = await prisma.pagePermission.findUnique({
      where: {
        id: permission.inheritedFromPermission
      }
    });

    if (sourcePermission?.inheritedFromPermission === existingPermission?.id) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      throw new CircularPermissionError(sourcePermission!.id, existingPermission!.id);
    }
  }

  return true;
}

/**
 * Creates a permission for a user, role or space, and a pageId
 * Works in upsert mode, ensuring there is always only 1 page permission per user/space/role && page pair
 * @param permission
 * @returns
 */
export async function createPagePermission (permission: IPagePermissionToCreate): Promise<IPagePermissionWithSource> {

  if (
    // Trying to assign to multiple groups at once
    (permission.userId && (permission.roleId || permission.spaceId))
    || (permission.roleId && permission.spaceId)
    // No group assigned
    || (!permission.roleId && !permission.userId && !permission.spaceId)) {
    throw new InvalidPermissionGranteeError();
  }

  let permissionToInheritFrom: PagePermission | null = null;

  if (permission.inheritedFromPermission) {
    await preventCircularPermissionInheritance(permission);
    const sourcePermission = await prisma.pagePermission.findUnique({
      where: {
        id: permission.inheritedFromPermission
      }
    });

    if (!sourcePermission) {
      throw new PermissionNotFoundError(permission.inheritedFromPermission);
    }

    permissionToInheritFrom = sourcePermission;
  }

  // We only need to store permissions in the database for the custom level.
  // For permission groups, we can simply load the template for that group when evaluating permissions
  const permissionsToAssign = permissionToInheritFrom ? permissionToInheritFrom.permissions : (permission.permissionLevel === 'custom' ? permission.permissions : []);

  const permissionLevel = permissionToInheritFrom ? permissionToInheritFrom.permissionLevel : permission.permissionLevel;

  if (!isTruthy(permissionLevel) || !isTruthy(PagePermissionLevel[permissionLevel])) {
    throw new InvalidPermissionLevelError(permissionLevel);
  }

  const atomicUpdateQuery: Prisma.PagePermissionWhereUniqueInput = {
  };

  if (permission.userId) {
    atomicUpdateQuery.userId_PageId = {
      pageId: permission.pageId,
      userId: permission.userId
    };
  }
  else if (permission.roleId) {
    atomicUpdateQuery.roleId_pageId = {
      pageId: permission.pageId,
      roleId: permission.roleId
    };
  }
  else if (permission.spaceId) {
    atomicUpdateQuery.spaceId_pageId = {
      pageId: permission.pageId,
      spaceId: permission.spaceId
    };
  }
  else {
    throw new InvalidPermissionGranteeError();
  }

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
      permissionLevel: permission.permissionLevel,
      permissions: permissionsToAssign,
      sourcePermission: !permission.inheritedFromPermission
        ? {
          disconnect: true
        }
        : {
          connect: {
            id: permission.inheritedFromPermission as string
          }
        }
    },
    create: {
      permissionLevel: permission.permissionLevel,
      permissions: permissionsToAssign,
      page: {
        connect: {
          id: permission.pageId
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
      sourcePermission: !permission.inheritedFromPermission
        ? undefined : {
          connect: {
            id: permission.inheritedFromPermission as string
          }
        }
    }
  });

  const childPages = await resolveChildPages(createdPermission.pageId);

  // Update all permissions that inherit from this
  await prisma.pagePermission.updateMany({
    where: {
      AND: [
        {
          OR: childPages.map(child => {
            return { pageId: child.id };
          })
        },
        {
          inheritedFromPermission: createdPermission.id
        }
      ]
    },
    data: {
      permissionLevel: createdPermission.permissionLevel,
      permissions: createdPermission.permissions
    }
  });

  // Update permissions that inherited from a parent permission
  // The new permission is now the authority
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
