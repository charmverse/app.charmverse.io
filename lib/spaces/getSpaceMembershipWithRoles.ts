import { prisma } from '@charmverse/core';

export async function getSpaceMembershipWithRoles({ userId, spaceId }: { userId: string; spaceId: string }) {
  return prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    },
    include: {
      spaceRoleToRole: {
        include: {
          role: true
        }
      },
      space: {
        include: {
          tokenGates: true
        }
      }
    }
  });
}
