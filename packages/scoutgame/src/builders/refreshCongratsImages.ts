import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

import { refreshCongratsImage } from './refreshCongratsImage';

export async function refreshCongratsImages() {
  const builderNfts = await prisma.builderNft.findMany({
    where: {
      season: currentSeason
    }
  });

  for (const builderNft of builderNfts) {
    if (builderNft?.tokenId) {
      const updatedBuilderNft = await refreshCongratsImage(builderNft);

      // log.info(
      //   `Builder congrats metadata image was created with the link:${updatedBuilderNft?.congratsImageUrl} for ${
      //     updatedBuilderNft?.id
      //   }`
      // );
    }
  }
}
