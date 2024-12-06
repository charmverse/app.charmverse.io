import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../../dates';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { builderContractStarterPackReadonlyApiClient } from '../clients/builderContractStarterPackReadClient';
import { builderNftChain, getBuilderStarterPackContractAddress } from '../constants';

import { uploadStarterPackArtwork, uploadStarterPackArtworkCongrats } from './starterPack/uploadStarterPackArtwork';

export async function createBuilderNftStarterPack({
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
  const currentPrice = await builderContractStarterPackReadonlyApiClient.getTokenPurchasePrice({
    args: { amount: BigInt(1) }
  });

  const fileUrl = await uploadStarterPackArtwork({
    imageHostingBaseUrl,
    displayName,
    season: currentSeason,
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadStarterPackArtworkCongrats({
    imageHostingBaseUrl,
    season: currentSeason,
    tokenId,
    userImage: fileUrl,
    builderId
  });

  await uploadMetadata({
    season: currentSeason,
    tokenId,
    path,
    starterPack: true
  });

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: getBuilderStarterPackContractAddress(),
      tokenId: Number(tokenId),
      season: currentSeason,
      currentPrice,
      imageUrl: fileUrl,
      congratsImageUrl,
      nftType: 'starter_pack'
    }
  });

  return builderNft;
}
