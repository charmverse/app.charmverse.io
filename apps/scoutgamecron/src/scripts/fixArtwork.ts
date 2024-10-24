import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { uploadMetadata } from '@packages/scoutgame/builderNfts/artwork/uploadMetadata';
import { builderContractReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractReadClient';
import { getBuilderContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { uploadArtwork, uploadArtworkCongrats } from '@packages/scoutgame/builderNfts/artwork/uploadArtwork';
import { currentSeason } from '@packages/scoutgame/dates';

async function refreshArtworks() {
  const builderNfts = await prisma.builderNft.findMany({
    where: {
      season: currentSeason
    },
    include: {
      builder: {
        select: {
          avatar: true,
          username: true
        }
      }
    },
    orderBy: {
      tokenId: 'asc'
    },
    skip: 124
  });

  console.log('Contract ', getBuilderContractAddress());

  const totalNfts = builderNfts.length;

  console.log(totalNfts);

  for (let i = 0; i < totalNfts; i++) {
    const nft = builderNfts[i];
    log.info(`[tokenId: ${nft.tokenId}] Updating artwork for NFT ${i+1} of ${totalNfts} `);

    const avatar = nft.builder.avatar;

    if (!avatar) {
      log.warn(`No avatar found for builder ${nft.builderId} at index ${i}`);
    }

    const tokenId = await builderContractReadonlyApiClient.getTokenIdForBuilder({
      args: { builderId: nft.builderId }
    });

    if (Number(tokenId) !== nft.tokenId) {
      throw new Error(`Token ID mismatch for builder ${nft.builderId} at index ${i}`);
    }

    const filePath = await uploadArtwork({
      avatar,
      season: currentSeason,
      tokenId: BigInt(tokenId),
      username: nft.builder.username
    });

    await prisma.builderNft.update({
      where: {
        id: nft.id
      },
      data: {
        imageUrl: filePath
      }
    });

    const metadataPath = await uploadMetadata({
      season: currentSeason,
      tokenId: BigInt(tokenId),
      username: nft.builder.username,
      attributes: []
    });

    log.info('Artwork uploaded', filePath);
    log.info('Metadata uploaded', metadataPath);
  }
}

// refreshArtworks().then(console.log);

