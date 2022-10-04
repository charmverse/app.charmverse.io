import { prisma } from 'db';

import type { Roleup } from './interfaces';

export async function countRoleMembers ({ roleId }: { roleId: string }): Promise<Roleup> {

  const role = await prisma.role.findUnique({
    where: {
      id: roleId
    },
    select: {
      name: true
    }
  });

  if (!role) {
    return {
      id: roleId,
      members: 0,
      name: 'Unknown role'
    };
  }

  const count = await prisma.spaceRoleToRole.count({
    where: {
      roleId
    }
  });

  return {
    id: roleId,
    members: count,
    name: role.name
  };

}
