import { PageOperations, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { IPagePermissionFlags, IPagePermissionUserRequest, IPagePermissionWithNestedSpaceRole, PageOperationType } from './page-permission-interfaces';
import { permissionTemplates } from './page-permission-mapping';

/**
 * Nested query to get the space role for a user who is requesting a page
 */
function permissionWithSpaceRoleQuery (request: IPagePermissionUserRequest): Prisma.PagePermissionFindFirstArgs {
  return {
    where: {
      pageId: request.pageId,
      page: {
        space: {
          spaceRoles: {
            some: {
              userId: request.userId
            }
          }
        }
      }
    },
    select: {
      page: {
        select: {
          space: {
            select: {
              spaceRoles: true
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
    prisma.pagePermission.findFirst(permissionWithSpaceRoleQuery(request)) as any as Promise<IPagePermissionWithNestedSpaceRole>,
    prisma.pagePermission.findMany(permissionsQuery(request))
  ]);

  // Check if user is a space admin so they gain full rights
  const foundSpaceRole = permissionWithSpaceRoleAndPermissions[0]?.page?.space?.spaceRoles?.[0];

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

  return computedPermissions;

}
