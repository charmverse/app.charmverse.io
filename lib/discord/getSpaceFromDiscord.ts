import { prisma } from '@charmverse/core';

export async function getSpacesFromDiscord(discordServerId: string) {
  return prisma.space.findMany({ where: { discordServerId } });
}
