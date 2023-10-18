import { prisma } from '@charmverse/core/prisma-client';

export async function listSpaceRoles(spaceId: string) {
  const roles = await prisma.role.findMany({
    orderBy: { createdAt: 'asc' },
    where: {
      spaceId
    },
    select: {
      id: true,
      name: true
    }
  });

  return roles;
}
