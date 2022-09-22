import type { Prisma } from '@prisma/client';
import { prisma } from 'db';
import type { IPageWithPermissions, PagesRequest } from '../interfaces';

/**
 * Utility for getting permissions of a page
 * @returns
 */
export function includePagePermissions (): Prisma.PageInclude & {
  permissions: {
    include: {
      sourcePermission: true
    }
  }
  } {
  return {
    permissions: {
      include: {
        sourcePermission: true
      }
    }
  };
}

export function accessiblePagesByPermissionsQuery ({ spaceId, userId }: {spaceId: string, userId: string}): Prisma.PagePermissionListRelationFilter {
  return {
    some: {
      OR: [
        {
          role: {
            spaceRolesToRole: {
              some: {
                spaceRole: {
                  userId,
                  spaceId
                }
              }
            }
          }
        },
        {
          userId
        },
        {
          space: {
            spaceRoles: {
              some: {
                userId,
                spaceId
              }
            }
          }
        },
        {
          public: true
        }
      ]
    }
  };
}

export function generateAccessiblePagesQuery ({ spaceId, userId, archived }: PagesRequest): Prisma.PageFindManyArgs {

  // Return only pages with public permissions
  if (!userId) {
    return {
      where: {
        spaceId,
        permissions: {
          some: {
            public: true
          }
        }
      }
    };
  }

  const archivedQuery = archived ? {
    deletedAt: {
      not: null
    }
  } : {
    deletedAt: null
  };

  return {
    where: {
      OR: [
        {
          spaceId,
          permissions: accessiblePagesByPermissionsQuery({
            spaceId,
            userId
          })
        },
        // Override for proposal templates so any user can instantiate them
        {
          type: 'proposal_template',
          space: {
            id: spaceId,
            spaceRoles: {
              some: {
                userId
              }
            }
          }
        },
        // Admin override to always return all pages
        {
          space: {
            id: spaceId,
            spaceRoles: {
              some: {
                userId,
                isAdmin: true
              }
            }
          }
        }
      ],
      ...archivedQuery
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  };
}

export async function getAccessiblePages ({ spaceId, userId, archived = false }: PagesRequest): Promise<IPageWithPermissions[]> {
  return prisma.page.findMany(
    generateAccessiblePagesQuery({ spaceId, userId, archived })
  ) as any as Promise<IPageWithPermissions[]>;
}
