import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { refreshCongratsImage } from '@packages/scoutgame/builders/refreshCongratsImage';
import { currentSeason } from '@packages/scoutgame/dates';

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
