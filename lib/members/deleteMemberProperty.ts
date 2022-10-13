import { prisma } from 'db';

export function deleteMemberProperty (id: string) {
  return prisma.memberProperty.delete({
    where: {
      id
    }
  });
}
