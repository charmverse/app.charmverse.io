import { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { IPageWithPermissions, PagesRequest } from '../interfaces';

function generateAccessiblePagesQuery ({ spaceId, userId }: PagesRequest): Prisma.PageFindManyArgs {

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
      ]
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

export async function getAccessiblePages ({ spaceId, userId }: {spaceId: string, userId?: string}): Promise<IPageWithPermissions[]> {
  return prisma.page.findMany(
    generateAccessiblePagesQuery({ spaceId, userId })
  ) as any as Promise<IPageWithPermissions[]>;
}
