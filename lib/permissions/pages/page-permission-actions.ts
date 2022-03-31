import { PagePermission, PagePermissionLevel, Prisma, Role, Space, User } from '@prisma/client';
import { prisma } from 'db';
import { isTruthy } from 'lib/utilities/types';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { IPagePermissionUpdate, IPagePermissionWithAssignee } from './page-permission-interfaces';

export async function listPagePermissions (pageId: string): Promise<IPagePermissionWithAssignee []> {
  const permissions = await prisma.pagePermission.findMany({
    where: {
      pageId
    },
    include: {
      role: true,
      space: true,
      user: true
    }
  });

  return permissions;
}

export async function createPagePermission (permission: PagePermission) {
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

  const createdPermission = await prisma.pagePermission.create({ data: permissionToCreate });

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

  await prisma.pagePermission.delete({ where: {
    id: permissionId
  } });

  return true;
}
