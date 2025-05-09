import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

type GetVisiblePropertiesProps = {
  spaceId: string | string[];
  requestingUserId: string | undefined;
  requestedUserId?: string;
};

export function getAccessibleMemberPropertiesBySpace({
  requestedUserId,
  requestingUserId,
  spaceId
}: GetVisiblePropertiesProps) {
  if (!requestingUserId) {
    return [];
  }

  const spaceIdQuery = typeof spaceId === 'string' ? [spaceId] : spaceId;

  const memberPropertyWhereAndQuery: Prisma.Enumerable<Prisma.MemberPropertyWhereInput> = [
    {
      space: {
        id: { in: spaceIdQuery },
        spaceRoles: {
          some: {
            userId: requestingUserId
          }
        }
      }
    }
  ];

  if (requestingUserId !== requestedUserId) {
    memberPropertyWhereAndQuery.push({
      OR: [
        // User has permission to view property
        {
          spaceId: { in: spaceIdQuery },
          permissions: accessiblePropertiesByPermissionsQuery({
            spaceIds: spaceIdQuery,
            userId: requestingUserId
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
                userId: requestingUserId,
                isAdmin: true
              }
            }
          }
        }
      ]
    });
  }

  return prisma.memberProperty.findMany({
    where: {
      AND: memberPropertyWhereAndQuery
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

export function accessiblePropertiesByPermissionsQuery({
  spaceIds,
  userId
}: {
  spaceIds: string[];
  userId: string;
}): Prisma.MemberPropertyPermissionListRelationFilter {
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

export function getAllMemberPropertiesBySpace({ spaceId }: { spaceId: string | string[] }) {
  const spaceIdQuery = typeof spaceId === 'string' ? [spaceId] : spaceId;

  return prisma.memberProperty.findMany({
    where: {
      space: { id: { in: spaceIdQuery } }
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
