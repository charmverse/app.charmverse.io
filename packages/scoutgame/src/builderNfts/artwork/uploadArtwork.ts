import { S3Client } from '@aws-sdk/client-s3';
import type { PutObjectCommandInput, S3ClientConfig } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { generateNftImage } from './generateNftImage';
import { getNftFilePath, imageDomain } from './utils';

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

export async function uploadArtwork({
  avatar,
  tokenId,
  season,
  username
}: {
  username: string;
  season: string;
  avatar: string | null;
  tokenId: bigint | number;
}) {
  const imageBuffer = await generateNftImage({
    avatar,
    username
  });

  const imagePath = getNftFilePath({ season, tokenId: Number(tokenId), type: 'artwork.png' });

  console.log(
    JSON.stringify(
      {
        tokenId: Number(tokenId),
        imagePath
      },
      null,
      2
    )
  );

  const params: PutObjectCommandInput = {
    ACL: 'public-read',
    Bucket: process.env.SCOUTGAME_S3_BUCKET,
    Key: `nft/${imagePath}`,
    Body: imageBuffer,
    ContentType: 'image/png'
  };

  const s3Upload = new Upload({
    client,
    params
  });

  await s3Upload.done();

  return `${imageDomain}/${imagePath}`;
}
