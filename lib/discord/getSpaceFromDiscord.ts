import { prisma } from '@charmverse/core';

import { InvalidInputError } from 'lib/utilities/errors';

export async function getSpacesFromDiscord(discordServerId: string) {
  const spaces = await prisma.space.findMany({ where: { discordServerId } });

  if (!spaces.length) {
    throw new InvalidInputError('Space not found');
  }

  return spaces;
}
