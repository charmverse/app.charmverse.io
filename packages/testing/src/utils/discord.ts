import { prisma } from '@charmverse/core/prisma-client';

export async function createDiscordUser({ userId, discordUserId }: { userId: string; discordUserId: string }) {
  return prisma.discordUser.create({
    data: {
      account: {},
      discordId: discordUserId,
      userId
    }
  });
}

export async function addSpaceDiscordServerId({
  spaceId,
  discordServerId
}: {
  spaceId: string;
  discordServerId: string;
}) {
  await prisma.space.update({ where: { id: spaceId }, data: { discordServerId } });
}
