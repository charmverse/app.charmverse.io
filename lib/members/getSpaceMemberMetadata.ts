import type { Role } from '@prisma/client';

import { prisma } from 'db';

export async function getSpaceMemberMetadata({
  spaceIds,
  memberId
}: {
  spaceIds: string | string[];
  memberId: string;
}) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: {
        in: Array.isArray(spaceIds) ? spaceIds : [spaceIds]
      },
      userId: memberId
    },
    select: {
      createdAt: true,
      spaceId: true,
      spaceRoleToRole: {
        include: {
          role: true
        }
      }
    }
  });

  const metadataBySpaceMap = spaceRoles.reduce<Record<string, { roles: Role[]; joinDate: Date }>>((acc, spaceRole) => {
    const roles = spaceRole.spaceRoleToRole?.map((spaceRoleToRole) => spaceRoleToRole.role);
    acc[spaceRole.spaceId] = {
      roles,
      joinDate: spaceRole.createdAt
    };
    return acc;
  }, {});

  return metadataBySpaceMap;
}
