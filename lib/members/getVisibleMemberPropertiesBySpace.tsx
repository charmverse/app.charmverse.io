import { prisma } from 'db';

export function getVisibleMemberPropertiesBySpace (userId: string, spaceId: string | string[]) {
  const spaceIdQuery = typeof spaceId === 'string' ? [spaceId] : spaceId;

  // TODO - handle permissions and select only properties accessible by userId
  return prisma.memberProperty.findMany({
    where: {
      spaceId: { in: spaceIdQuery }
    },
    orderBy: {
      index: 'asc'
    }
  });
}
