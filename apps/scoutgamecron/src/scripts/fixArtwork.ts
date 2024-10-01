import { log } from "@charmverse/core/log";
import { prisma } from "@charmverse/core/prisma-client";
import { builderContractReadonlyApiClient } from "@packages/scoutgame/builderNfts/clients/builderContractReadClient";
import { builderContractAddress } from "@packages/scoutgame/builderNfts/constants";
import { uploadArtwork } from "@packages/scoutgame/builderNfts/uploadArtwork";
import { currentSeason } from "@packages/scoutgame/dates";




async function refreshArtworks() {
  const builderNfts = await prisma.builderNft.findMany({
    where: {
      season: currentSeason,
      contractAddress: builderContractAddress
    },
    include: {
      builder: {
        select: {
          avatar: true,
          username: true
        }
      }
    }
  });

  const totalNfts = builderNfts.length;

  for (let i = 0; i < totalNfts; i++) {
    const nft = builderNfts[i];
    log.info(`Updating artwork for NFT ${nft.tokenId} of ${totalNfts}`);

    const avatar = nft.builder.avatar;

    if (!avatar) {
      log.warn(`No avatar found for builder ${nft.builderId} at index ${i}`);
    }

    const tokenId = await builderContractReadonlyApiClient.getTokenIdForBuilder({
      args: { builderId: nft.builderId }
    });


    await uploadArtwork({
      avatar,
      season: currentSeason,
      tokenId: BigInt(tokenId),
      username: nft.builder.username
    })
    
  }
}