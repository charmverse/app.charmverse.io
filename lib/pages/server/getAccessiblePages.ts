import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { IPageWithPermissions, PagesRequest } from '../interfaces';

function generateAccessiblePagesQuery ({ spaceId, userId, archived }: PagesRequest): Prisma.PageFindManyArgs {

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
  } : {};

  return {
    where: {
      OR: [
        {
          spaceId,
          permissions: {
            some: {
              OR: [
                {
                  role: {
                    spaceRolesToRole: {
                      some: {
                        spaceRole: {
                          userId
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
                        userId
                      }
                    }
                  }
                },
                {
                  public: true
                }
              ]
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
