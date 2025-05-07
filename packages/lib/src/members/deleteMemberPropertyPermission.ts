import { prisma } from '@charmverse/core/prisma-client';

export function deleteMemberPropertyPermission(id: string) {
  return prisma.memberPropertyPermission.delete({
    where: {
      id
    }
  });
}
