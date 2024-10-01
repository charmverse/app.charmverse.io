import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

import { builderContractReadonlyApiClient } from './clients/builderContractReadClient';
import { builderContractAddress, builderNftChain } from './constants';
import { uploadArtwork } from './uploadArtwork';

export async function createBuilderNft({
  avatar,
  tokenId,
  builderId,
  username
}: {
  username: string;
  avatar: string | null;
  tokenId: bigint;
  builderId: string;
}) {
  const currentPrice = await builderContractReadonlyApiClient.getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });

  const fileUrl = await uploadArtwork({
    username,
    season: currentSeason,
    avatar,
    tokenId
  });

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress,
      tokenId: Number(tokenId),
      season: currentSeason,
      currentPrice,
      imageUrl: fileUrl
    }
  });

  return builderNft;
}
