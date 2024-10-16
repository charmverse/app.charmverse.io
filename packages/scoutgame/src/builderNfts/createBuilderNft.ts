import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

import { uploadArtwork, uploadArtworkCongrats } from './artwork/uploadArtwork';
import { uploadMetadata } from './artwork/uploadMetadata';
import { builderContractReadonlyApiClient } from './clients/builderContractReadClient';
import { getBuilderContractAddress, builderNftChain } from './constants';

export async function createBuilderNft({
  imageHostingBaseUrl,
  avatar,
  tokenId,
  builderId,
  username
}: {
  imageHostingBaseUrl?: string;
  username: string;
  avatar: string | null;
  tokenId: bigint;
  builderId: string;
}) {
  const currentPrice = await builderContractReadonlyApiClient.getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });

  const fileUrl = await uploadArtwork({
    imageHostingBaseUrl,
    username,
    season: currentSeason,
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadArtworkCongrats({
    imageHostingBaseUrl,
    season: currentSeason,
    tokenId,
    userImage: fileUrl
  });

  await uploadMetadata({
    season: currentSeason,
    tokenId,
    username
  });

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: getBuilderContractAddress(),
      tokenId: Number(tokenId),
      season: currentSeason,
      currentPrice,
      imageUrl: fileUrl,
      congratsImageUrl
    }
  });

  return builderNft;
}
