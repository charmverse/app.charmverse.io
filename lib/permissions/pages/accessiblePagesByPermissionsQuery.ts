import type { Prisma } from '@charmverse/core/dist/prisma';

export function accessiblePagesByPermissionsQuery({
  spaceId,
  userId
}: {
  spaceId: string;
  userId: string;
}): Prisma.PagePermissionListRelationFilter {
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
