import { prisma } from '@charmverse/core/prisma-client';

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

  const totalStrikes = await prisma.builderStrike.count({
    where: {
      builderId,
      builderEvent: {
        season: builderEvent.season
      }
    }
  });

  let isBanned = false;

  if (totalStrikes >= 3) {
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
