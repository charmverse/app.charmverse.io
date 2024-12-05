import { prisma } from '@charmverse/core/prisma-client';

import { uploadArtwork } from '../builderNfts/artwork/uploadArtwork';
import { uploadShareImage } from '../builderNfts/artwork/uploadShareImage';
import { currentSeason } from '../dates';
import { log } from '@charmverse/core/log';

async function uploadNFTArtwork() {
  const builders = await prisma.scout.findMany({
    where: {
      // Add your user path here
      path: 'safwan',
      builderStatus: {
        in: ['approved', 'banned']
      }
    },
    select: {
      id: true,
      avatar: true,
      displayName: true,
      builderNfts: {
        where: {
          season: currentSeason
        }
      }
    }
  });

  for (const builder of builders) {
    const builderNft = builder.builderNfts[0];
    try {
      const imageUrl = await uploadArtwork({
        displayName: 'safwan 🎩🚨',
        season: currentSeason,
        avatar: builder.avatar,
        tokenId: builderNft.tokenId
      });
      const congratsImageUrl = await uploadShareImage({
        season: currentSeason,
        tokenId: builderNft.tokenId,
        userImage: imageUrl,
        builderId: builder.id,
        imageHostingBaseUrl: process.env.DOMAIN
      });

      await prisma.builderNft.update({
        where: {
          id: builderNft.id
        },
        data: {
          imageUrl,
          congratsImageUrl
        }
      });
      log.info(`Updated ${builderNft.tokenId}`, {
        tokenId: builderNft.tokenId
      });
    } catch (error) {
      log.error(`Error updating ${builderNft.tokenId}`, {
        error,
        tokenId: builderNft.tokenId
      });
    }
  }
}

uploadNFTArtwork();
