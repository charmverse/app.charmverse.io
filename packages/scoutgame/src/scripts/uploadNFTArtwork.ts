import { prisma } from '@charmverse/core/prisma-client';

import { uploadArtwork } from '../builderNfts/uploadArtwork';

async function query() {
  const scouts = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    },
    include: {
      githubUser: true,
      builderNfts: true
    }
  });
  // const w = await prisma.builderNft.deleteMany({});
  const mappedWithimage = await Promise.all(
    scouts.map(async (scout) => {
      const imageUrl = await uploadArtwork({
        username: scout.username,
        season: scout.builderNfts[0].season,
        avatar: scout.avatar,
        tokenId: scout.builderNfts[0].tokenId
      });
      return {
        nft: scout.builderNfts[0],
        scout,
        imageUrl
      };
    })
  );

  for (const image of mappedWithimage) {
    await prisma.builderNft.update({
      where: {
        id: image.nft!.id
      },
      data: {
        imageUrl: image.imageUrl
      }
    });
  }
}

query();
