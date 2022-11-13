
import { prisma } from 'db';

export async function getSpaceMemberJoinDates ({ spaceIds, memberId }:{ spaceIds: string | string[], memberId: string }) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: {
        in: Array.isArray(spaceIds) ? spaceIds : [spaceIds]
      },
      userId: memberId
    },
    select: {
      createdAt: true,
      spaceId: true
    }
  });

  const joinDatesMap = spaceRoles.reduce(
    (acc, spaceRole) => {
      const joinDate = spaceRole.createdAt;
      acc[spaceRole.spaceId] = joinDate;
      return acc;
    },
   {} as Record<string, Date>
  );

  return joinDatesMap;
}
