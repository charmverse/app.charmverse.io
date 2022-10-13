import { prisma } from 'db';

export function getMemberPropertiesBySpace (userId: string, spaceId: string) {
  // TODO - handle permissions and select only properties accessible by userId
  return prisma.memberProperty.findMany({
    where: {
      spaceId
    }
  });
}
