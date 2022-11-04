import type { Prisma } from '@prisma/client';

import { prisma } from 'db';

type GetVisiblePropertiesProps = {
  spaceId: string | string[];
  userId: string | undefined;
}

export function getAccessibleMemberPropertiesBySpace ({ userId, spaceId }: GetVisiblePropertiesProps) {
  if (!userId) {
    return [];
  }

  const spaceIdQuery = typeof spaceId === 'string' ? [spaceId] : spaceId;

  return prisma.memberProperty.findMany({
    where: {
      AND: [
        // User must be a member of space
        {
          space: {
            id: { in: spaceIdQuery },
            spaceRoles: {
              some: {
                userId
              }
            }
          }
        },
        {
          OR: [
            // User has permission to view property
            {
              spaceId: { in: spaceIdQuery },
              permissions: accessiblePropertiesByPermissionsQuery({
                spaceIds: spaceIdQuery,
                userId
              })
            },
            // No permissions are set, permission visible for everyone
            {
              spaceId: { in: spaceIdQuery },
              permissions: { none: {} }
            },
            // Admin override to always return all pages
            {
              space: {
                id: { in: spaceIdQuery },
                spaceRoles: {
                  some: {
                    userId,
                    isAdmin: true
                  }
                }
              }
            }
          ]
        }
      ]
    },
    orderBy: {
      index: 'asc'
    },
    include: {
      space: true,
      permissions: {
        include: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });
}

export function accessiblePropertiesByPermissionsQuery ({ spaceIds, userId }:
  { spaceIds: string[], userId: string }): Prisma.MemberPropertyPermissionListRelationFilter {
  return {
    some: {
      role: {
        spaceRolesToRole: {
          some: {
            spaceRole: {
              userId,
              spaceId: { in: spaceIds }
            }
          }
        }
      }
    }
  };
}
