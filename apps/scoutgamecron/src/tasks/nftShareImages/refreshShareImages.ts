import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { refreshShareImage } from '@packages/scoutgame/builders/refreshShareImage';
import { currentSeason } from '@packages/scoutgame/dates';

export async function refreshShareImages() {
  const builderNfts = await prisma.builderNft.findMany({
    where: {
      season: currentSeason
    }
  });

  for (const builderNft of builderNfts) {
    if (builderNft?.tokenId) {
      const updatedBuilderNft = await refreshShareImage(builderNft, process.env.IMAGE_HOSTING_DOMAIN).catch((error) => {
        log.error(`Error refreshing share image for NFT`, {
          error,
          userId: builderNft.builderId
        });
        return null;
      });

      // log.info(
      //   `Builder congrats metadata image was created with the link:${updatedBuilderNft?.congratsImageUrl} for ${
      //     updatedBuilderNft?.id
      //   }`
      // );
    }
  }
}
