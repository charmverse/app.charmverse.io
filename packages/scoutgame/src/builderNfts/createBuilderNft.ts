import { S3Client, type PutObjectCommandInput, type S3ClientConfig } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

import { builderApiClient } from './builderApiClient';
import { builderContractAddress, builderNftChain } from './constants';
import { generateNftImage } from './generateNftImage';

function getS3ClientConfig() {
  const config: Pick<S3ClientConfig, 'region' | 'credentials'> = {
    region: process.env.S3_UPLOAD_REGION
  };

  if (process.env.S3_UPLOAD_KEY && process.env.S3_UPLOAD_SECRET) {
    config.credentials = {
      accessKeyId: process.env.S3_UPLOAD_KEY as string,
      secretAccessKey: process.env.S3_UPLOAD_SECRET as string
    };
  }
  return config;
}

const client = new S3Client(getS3ClientConfig());

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

  const imageBuffer = await generateNftImage({
    avatar,
    username
  });

  const s3Path = `nfts/seasons/${currentSeason}/beta/${tokenId}/artwork.png`;

  const params: PutObjectCommandInput = {
    ACL: 'public-read',
    Bucket: process.env.SCOUTGAME_S3_BUCKET,
    Key: s3Path,
    Body: imageBuffer,
    ContentType: 'image/png'
  };

  const s3Upload = new Upload({
    client,
    params
  });

  await s3Upload.done();

  const fileUrl = `https://s3.amazonaws.com/${process.env.SCOUTGAME_S3_BUCKET}/${s3Path}`;

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
