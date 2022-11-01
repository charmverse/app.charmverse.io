
import { prisma } from 'db';

export function deleteMemberPropertyPermission (id: string) {
  return prisma.memberPropertyPermission.delete({
    where: {
      id
    }
  });
}
