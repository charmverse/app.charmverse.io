import { prisma } from '@charmverse/core/prisma-client';

export async function getBuilderStrikesCount(builderId: string) {
  const strikes = await prisma.builderStrike.count({
    where: {
      builderId
    }
  });
  return strikes;
}
