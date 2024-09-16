import { prisma } from '@charmverse/core/prisma-client';

import { getStrikesForSeason } from './getStrikesForSeason';

export async function strikeBuilder({ builderId, builderEventId }: { builderId: string; builderEventId: string }) {
  const builderEvent = await prisma.builderEvent.findFirstOrThrow({
    where: {
      id: builderEventId
    },
    select: {
      season: true
    }
  });

  await prisma.builderStrike.create({
    data: {
      builderId,
      builderEventId
    }
  });

  let isBanned = false;

  const strikesForSeason = await getStrikesForSeason({ season: builderEvent.season });

  if (strikesForSeason >= 3) {
    await prisma.scout.update({
      where: {
        id: builderId
      },
      data: {
        bannedAt: new Date()
      }
    });
    isBanned = true;
  }

  return {
    isBanned
  };
}
