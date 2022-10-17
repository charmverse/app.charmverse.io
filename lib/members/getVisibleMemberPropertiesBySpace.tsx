import { prisma } from 'db';

type GetVisiblePropertiesProps = {
  spaceId: string | string[];
}

export function getVisibleMemberPropertiesBySpace ({ spaceId }: GetVisiblePropertiesProps) {
  const spaceIdQuery = typeof spaceId === 'string' ? [spaceId] : spaceId;

  // TODO - handle permissions and select only properties accessible by userId
  return prisma.memberProperty.findMany({
    where: {
      spaceId: { in: spaceIdQuery }
    },
    orderBy: {
      index: 'asc'
    },
    include: {
      space: true
    }
  });
}
