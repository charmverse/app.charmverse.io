import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../../dates';
import { uploadArtwork } from '../artwork/uploadArtwork';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { uploadShareImage } from '../artwork/uploadShareImage';
import { builderContractReadonlyApiClient } from '../clients/builderContractReadClient';
import { builderNftChain, getBuilderContractAddress } from '../constants';

export async function createBuilderNft({
  imageHostingBaseUrl,
  avatar,
  tokenId,
  builderId,
  displayName,
  path
}: {
  imageHostingBaseUrl?: string;
  displayName: string;
  path: string;
  avatar: string | null;
  tokenId: bigint;
  builderId: string;
  starterNft?: boolean;
}) {
  const currentPrice = await builderContractReadonlyApiClient.getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });

  const fileUrl = await uploadArtwork({
    imageHostingBaseUrl,
    displayName,
    season: currentSeason,
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadShareImage({
    imageHostingBaseUrl,
    season: currentSeason,
    tokenId,
    userImage: fileUrl,
    builderId
  });

  await uploadMetadata({
    season: currentSeason,
    tokenId,
    path
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
