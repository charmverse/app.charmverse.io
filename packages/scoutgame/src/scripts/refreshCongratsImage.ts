import { prisma } from '@charmverse/core/prisma-client';
import { uploadArtworkCongrats } from '../builderNfts/artwork/uploadArtwork';
import { currentSeason } from '../dates';

export async function refreshCongratsImages() {
  const builderNfts = await prisma.builderNft.findMany({
    where: {
      season: currentSeason
    }
  });

  for (const builderNft of builderNfts) {
    if (!builderNft?.tokenId) {
      continue;
    }

    const congratsImageUrl = await uploadArtworkCongrats({
      season: currentSeason,
      tokenId: builderNft.tokenId,
      userImage: builderNft.imageUrl || null,
      builderId: builderNft.builderId,
      imageHostingBaseUrl: process.env.DOMAIN
    });

    const updatedBuilderNft = await prisma.builderNft.update({
      where: {
        id: builderNft?.id
      },
      data: {
        congratsImageUrl
      }
    });

    console.log(
      'Builder congrats metadata image was created with the link:' +
        updatedBuilderNft?.congratsImageUrl +
        ' for ' +
        builderNft?.id
    );
  }
}

// refreshCongratsImages();
