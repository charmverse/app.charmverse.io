
import type { Role } from '@prisma/client';

import { prisma } from 'db';

export async function getSpaceMemberRoles ({ spaceIds, memberId }:{ spaceIds: string | string[], memberId: string }) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: {
        in: Array.isArray(spaceIds) ? spaceIds : [spaceIds]
      },
      userId: memberId
    },
    include: {
      spaceRoleToRole: {
        include: {
          role: true
        }
      }
    }
  });

  const rolesBySpaceMap = spaceRoles.reduce(
    (acc, spaceRole) => {
      const roles = spaceRole.spaceRoleToRole?.map(spaceRoleToRole => spaceRoleToRole.role);
      acc[spaceRole.spaceId] = roles;
      return acc;
    },
   {} as Record<string, Role[]>
  );

  return rolesBySpaceMap;
}
