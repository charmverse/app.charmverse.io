
import type { Role } from '@prisma/client';

import { prisma } from 'db';

export async function getSpaceMemberRoles (spaceId: string | string[]) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: {
        in: Array.isArray(spaceId) ? spaceId : [spaceId]
      }
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
