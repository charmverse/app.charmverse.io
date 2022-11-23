import { prisma } from 'db';

export async function isSpaceDiscordAdmin ({ userId, spaceId }: { userId: string, spaceId: string }) {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (!space || !space.adminDiscordUserId) {
    return false;
  }

  const discordUser = await prisma.discordUser.findUnique({
    where: {
      userId
    }
  });

  return discordUser?.discordId === space.adminDiscordUserId;
}

