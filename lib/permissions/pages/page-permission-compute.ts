import { PageOperations, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { IPagePermissionFlags, IPagePermissionUserRequest, IPageWithNestedSpaceRole, PageOperationType } from './page-permission-interfaces';
import { permissionTemplates } from './page-permission-mapping';

/**
 * Nested query to get the space role a user has in the space that owns this page
 */
function pageWithSpaceRoleQuery (request: IPagePermissionUserRequest): Prisma.PageFindFirstArgs {
  return {
    where: {
      id: request.pageId
    },
    select: {
      space: {
        select: {
          spaceRoles: {
            where: {
              userId: request.userId
            }
          }
        }
      }
    }
  };
}

/**
 * Get all permissions applicable to a user for a specific page
 */
function permissionsQuery (request: IPagePermissionUserRequest): Prisma.PagePermissionFindManyArgs {
  return {
    where: {
      OR: [

        {
          userId: request.userId,
          pageId: request.pageId
        },
        {
          role: {
            spaceRolesToRole: {
              some: {
                spaceRole: {
                  userId: request.userId
                }
              }
            }
          },
          pageId: request.pageId
        },
        {
          space: {
            spaceRoles: {
              some: {
                userId: request.userId
              }
            }
          },
          pageId: request.pageId
        }
      ]
    }
  };
}

export async function computeUserPagePermissions (request: IPagePermissionUserRequest): Promise<IPagePermissionFlags> {

  const permissionWithSpaceRoleAndPermissions = await Promise.all([
    // eslint-disable-next-line max-len
    prisma.page.findFirst(pageWithSpaceRoleQuery(request)) as any as Promise<IPageWithNestedSpaceRole>,
    prisma.pagePermission.findMany(permissionsQuery(request))
  ]);

  // Check if user is a space admin so they gain full rights
  const foundSpaceRole = permissionWithSpaceRoleAndPermissions[0]?.space?.spaceRoles?.[0];

  /**
   * Commented for our demo
  console.log('Space roles list', permissionWithSpaceRoleAndPermissions[0]?.page?.space?.spaceRoles);
  console.log('Full permissions list', permissionWithSpaceRoleAndPermissions[1]);

  */

  if (foundSpaceRole && (foundSpaceRole.role === 'admin' || foundSpaceRole.isAdmin === true)) {

    const fullPermissions = Object.keys(PageOperations) as PageOperationType [];

    return new AllowedPagePermissions(fullPermissions);
  }

  const permissions = permissionWithSpaceRoleAndPermissions[1];

  const computedPermissions = new AllowedPagePermissions();

  permissions.forEach(permission => {

    // Custom permissions are persisted to the database. Other permission groups are evaluated by the current mapping
    const permissionsToAdd = permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel];

    computedPermissions.addPermissions(permissionsToAdd);
  });

  if (request.pageId === '843e00b2-58a2-486c-92f7-dbed93123c6b') {
    console.log('Will provide these permissions', computedPermissions);
  }

  return computedPermissions;

}

