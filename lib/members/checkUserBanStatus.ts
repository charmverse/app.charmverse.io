import { prisma } from '@charmverse/core/prisma-client';

export async function checkUserBanStatus({ spaceId, userId }: { userId: string; spaceId: string }) {
  const blacklistedUser = await prisma.blacklistedSpaceUser.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  return blacklistedUser !== null;
}
