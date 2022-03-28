import { Prisma, Page, PagePermission, PagePermissionLevel } from '@prisma/client';
import { prisma } from 'db';
import { IPagePermissionListRequest, IPagePermissionRequest, IPagePermissionFlags, AllowedPagePermissions } from './page-permission-mapping';

export async function evaluatePagePermission (
  request: IPagePermissionRequest
): Promise<IPagePermissionFlags> {

  // Get roles
  // Get permissions for role

  console.log('Received request', request);

  const permissions = await prisma.pagePermission.findMany({
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
  });

  console.log('PERMISSIONS', permissions.length, permissions);

  const computedPermission = new AllowedPagePermissions();

  if (permissions.length > 0) {
    // Iterate through all existing permission sets to see if at least one of them provides a permission to the user
    (Object.keys(computedPermission) as Array<keyof IPagePermissionFlags>).forEach(permissionName => {

      const hasPermission = permissions.find(existingPermissionSet => {
        return existingPermissionSet[permissionName] === true;
      }) !== undefined;

      computedPermission[permissionName] = hasPermission;

    });
  }

  return computedPermission;

}
