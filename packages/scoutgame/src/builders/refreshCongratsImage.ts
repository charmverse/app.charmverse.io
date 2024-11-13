import type { BuilderNft } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { uploadArtworkCongrats } from '../builderNfts/artwork/uploadArtwork';
import { currentSeason } from '../dates';

export async function refreshCongratsImage(builderNft: BuilderNft) {
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

  return updatedBuilderNft;
}
