import { S3Client, type PutObjectCommandInput, type S3ClientConfig } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

import { builderApiClient } from './builderApiClient';
import { builderContractAddress, builderNftChain } from './constants';
import { generateNftImage } from './generateNftImage';
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
  const currentPrice = await builderApiClient.getTokenQuote({
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
