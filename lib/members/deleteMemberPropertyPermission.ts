import { prisma } from '@charmverse/core';

export function deleteMemberPropertyPermission(id: string) {
  return prisma.memberPropertyPermission.delete({
    where: {
      id
    }
  });
}
