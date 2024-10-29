import { prisma } from '@charmverse/core/prisma-client';

import { uploadArtwork, uploadArtworkCongrats } from '../builderNfts/artwork/uploadArtwork';

async function uploadNFTArtwork() {
  const scouts = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    },
    select: {
      avatar: true,
      displayName: true,
      builderNfts: true
    }
  });
  // const w = await prisma.builderNft.deleteMany({});
  const mappedWithimage = await Promise.all(
    scouts.map(async (scout) => {
      const imageUrl = await uploadArtwork({
        displayName: scout.displayName,
        season: scout.builderNfts[0].season,
        avatar: scout.avatar,
        tokenId: scout.builderNfts[0].tokenId
      });
      const congratsImageUrl = await uploadArtworkCongrats({
        season: scout.builderNfts[0].season,
        tokenId: scout.builderNfts[0].tokenId,
        userImage: imageUrl
      });
      return {
        nft: scout.builderNfts[0],
        scout,
        imageUrl,
        congratsImageUrl
      };
    })
  );

  for (const image of mappedWithimage) {
    await prisma.builderNft.update({
      where: {
        id: image.nft!.id
      },
      data: {
        imageUrl: image.imageUrl,
        congratsImageUrl: image.congratsImageUrl
      }
    });
  }
}

uploadNFTArtwork();
