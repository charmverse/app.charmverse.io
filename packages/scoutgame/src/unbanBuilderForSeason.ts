import { prisma } from '@charmverse/core/prisma-client';

export async function unbanBuilderForSeason({ builderId, season }: { builderId: string; season: number }) {
  await prisma.$transaction([
    prisma.builderStrike.updateMany({
      where: {
        builderId,
        builderEvent: {
          season
        }
      },
      data: {
        deletedAt: new Date()
      }
    }),
    prisma.scout.update({
      where: {
        id: builderId
      },
      data: {
        bannedAt: null
      }
    })
  ]);
}
