import type { BuilderNft } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/utils/constants';

import { uploadShareImage } from '../builderNfts/artwork/uploadShareImage';

export async function refreshShareImage(builderNft: BuilderNft, imageHostingBaseUrl = baseUrl) {
  const congratsImageUrl = await uploadShareImage({
    season: builderNft.season,
    tokenId: builderNft.tokenId,
    userImage: builderNft.imageUrl || null,
    builderId: builderNft.builderId,
    imageHostingBaseUrl
  });

  const updatedBuilderNft = await prisma.builderNft.update({
    where: {
      id: builderNft.id
    },
    data: {
      congratsImageUrl
    }
  });

  return updatedBuilderNft;
}
