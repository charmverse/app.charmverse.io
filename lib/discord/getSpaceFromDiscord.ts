import { prisma } from 'db';
import { InvalidInputError } from 'lib/utilities/errors';

export async function getSpaceFromDiscord(discordServerId: string) {
  const space = await prisma.space.findFirst({ where: { discordServerId } });

  if (!space) {
    throw new InvalidInputError('Space not found');
  }

  return space;
}
