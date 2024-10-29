import { prisma } from '@charmverse/core/prisma-client';

import { uploadArtwork, uploadArtworkCongrats } from '../builderNfts/artwork/uploadArtwork';
import { currentSeason } from '../dates';
import { log } from '@charmverse/core/log';

async function uploadNFTArtwork() {
  const builders = await prisma.scout.findMany({
    where: {
      username: 'safwan',
      builderStatus: {
        in: ['approved', 'banned']
      }
    },
    select: {
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
        displayName: 'safwan ⌐◨-◨ 𓏲🎩🚨',
        season: currentSeason,
        avatar: builder.avatar,
        tokenId: builderNft.tokenId,
        currentNftImage: builderNft.imageUrl
      });
      const congratsImageUrl = await uploadArtworkCongrats({
        season: currentSeason,
        tokenId: builderNft.tokenId,
        userImage: imageUrl
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
