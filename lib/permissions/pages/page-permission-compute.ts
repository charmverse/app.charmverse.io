import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { PageNotFoundError } from 'lib/pages/server';

import { AllowedPagePermissions } from './available-page-permissions.class';
import type {
  IPagePermissionFlags,
  IPagePermissionUserRequest,
  IPageWithNestedSpaceRole
} from './page-permission-interfaces';
import { permissionTemplates } from './page-permission-mapping';
import { computePagePermissionsUsingProposalPermissions } from './pagePermissionsWithComputeProposalPermissions';

/**
 * Nested query to get the space role a user has in the space that owns this page
 */
function pageWithSpaceRoleQuery(request: IPagePermissionUserRequest): Prisma.PageFindFirstArgs {
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
function permissionsQuery(request: IPagePermissionUserRequest): Prisma.PagePermissionFindManyArgs {
  // Allows anonymous queries for only public permissions
  if (!request.userId) {
    return {
      where: {
        pageId: request.pageId,
        public: true
      }
    };
  }

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
        },
        {
          public: true,
          pageId: request.pageId
        }
      ]
    }
  };
}

export async function computeUserPagePermissions({
  pageId,
  allowAdminBypass = true,
  userId
}: IPagePermissionUserRequest): Promise<IPagePermissionFlags> {
  const pageInDb = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      proposalId: true
    }
  });

  if (!pageInDb) {
    throw new PageNotFoundError(pageId);
  }

  if (pageInDb.proposalId) {
    return computePagePermissionsUsingProposalPermissions({
      resourceId: pageId,
      userId
    });
  }

  const [foundSpaceRole, permissions] = await Promise.all([
    // Check if user is a space admin for this page so they gain full rightss
    (
      prisma.page.findFirst(pageWithSpaceRoleQuery({ pageId, userId })) as any as Promise<IPageWithNestedSpaceRole>
    ).then((page) => {
      return page?.space?.spaceRoles?.find((spaceRole) => spaceRole.userId === userId);
    }),
    prisma.pagePermission.findMany(permissionsQuery({ pageId, userId }))
  ]);

  // TODO DELETE LATER when we remove admin access to workspace
  if (foundSpaceRole && foundSpaceRole.isAdmin === true && allowAdminBypass) {
    return new AllowedPagePermissions().full;
  }

  const computedPermissions = new AllowedPagePermissions();

  permissions.forEach((permission) => {
    // Custom permissions are persisted to the database. Other permission groups are evaluated by the current mapping
    const permissionsToAdd =
      permission.permissionLevel === 'custom'
        ? permission.permissions
        : permissionTemplates[permission.permissionLevel];

    computedPermissions.addPermissions(permissionsToAdd);
  });

  return computedPermissions.operationFlags;
}
