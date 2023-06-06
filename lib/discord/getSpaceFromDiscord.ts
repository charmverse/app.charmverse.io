import { prisma } from '@charmverse/core/prisma-client';

export async function getSpacesFromDiscord(discordServerId: string) {
  return prisma.space.findMany({ where: { discordServerId } });
}
