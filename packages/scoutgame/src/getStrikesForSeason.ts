import { prisma } from '@charmverse/core/prisma-client';

export async function getStrikesForSeason({ season }: { season: number }) {
  const strikes = await prisma.builderStrike.count({
    where: {
      builderEvent: {
        season
      }
    }
  });

  return strikes;
}
