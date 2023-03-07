import { prisma } from 'db';

export async function isSpaceAdmin({ spaceId, userId }: { spaceId: string; userId: string }) {
  const userSpaceRole = await prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        userId,
        spaceId
      }
    },
    select: {
      isAdmin: true
    }
  });

  return userSpaceRole?.isAdmin ?? false;
}
