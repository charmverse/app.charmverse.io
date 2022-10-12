import { prisma } from 'db';

export function getMemberPropertiesBySpace (spaceId: string) {
  // TODO - handle permissions and select only properties accessible by session user
  return prisma.memberProperty.findMany({
    where: {
      spaceId
    }
  });
}
