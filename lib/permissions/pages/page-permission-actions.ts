import { PagePermission, PagePermissionLevel, Prisma, Role, Space, User } from '@prisma/client';
import { prisma } from 'db';
import { isTruthy } from 'lib/utilities/types';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { InvalidPermissionGranteeError } from './errors';
import { IPagePermissionToCreate, IPagePermissionUpdate, IPagePermissionWithAssignee, IPagePermissionWithSource } from './page-permission-interfaces';

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

/**
 * Creates a permission for a user, role or space, and a pageId
 * Works in upsert mode, ensuring there is always only 1 page permission per user/space/role && page pair
 * @param permission
 * @returns
 */
export async function createPagePermission (permission: IPagePermissionToCreate): Promise<IPagePermissionWithSource> {
  const permissionLevel = permission.permissionLevel;

  if (!isTruthy(permissionLevel) || !isTruthy(PagePermissionLevel[permissionLevel])) {
    throw {
      error: 'Please provide a valid permission level'
    };
  }

  // We only need to store permissions in the database for the custom level.
  // For permission groups, we can simply load the template for that group when evaluating permissions
  const permissionsToAssign = permission.permissionLevel === 'custom' ? permission.permissions : [];

  const permissionToCreate = {
    permissionLevel: permission.permissionLevel,
    permissions: permissionsToAssign,
    page: {
      connect: {
        id: permission.pageId
      }
    }

  } as Prisma.PagePermissionCreateInput;

  if (
    (permission.userId && (permission.roleId || permission.spaceId))
    || (permission.roleId && permission.spaceId)) {
    throw new InvalidPermissionGranteeError();
  }

  // Ensure only 1 group at a time is linked to this permission
  if (permission.userId) {
    permissionToCreate.user = {
      connect: {
        id: permission.userId
      }
    };
  }
  else if (permission.roleId) {
    permissionToCreate.role = {
      connect: {
        id: permission.roleId
      }
    };
  }
  else if (permission.spaceId) {
    permissionToCreate.space = {
      connect: {
        id: permission.spaceId
      }
    };
  }
  else {
    throw {
      error: 'Permissions must be linked to a user, role or space'
    };

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

  // Delete the permission and the permissions
  await prisma.pagePermission.deleteMany({ where: {
    OR: [

    ]
    //    id: permissionId
  } });

  return true;
}
