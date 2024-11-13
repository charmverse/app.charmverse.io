import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

export async function getBuilderNft(builderId: string) {
  return prisma.builderNft.findUnique({
    where: {
      builderId_season: {
        builderId,
        season: currentSeason
      }
    },
    select: {
      imageUrl: true,
      currentPrice: true
    }
  });
}
