import { S3Client } from '@aws-sdk/client-s3';
import type { PutObjectCommandInput, S3ClientConfig } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { getBuilderActivities } from '../../../builders/getBuilderActivities';
import { getBuilderNft } from '../../../builders/getBuilderNft';
import { getBuilderScouts } from '../../../builders/getBuilderScouts';
import { getBuilderStats } from '../../../builders/getBuilderStats';
import { getNftCongratsPath, getNftTokenUrlPath, imageDomain } from '../../artwork/utils';
import { getBuilderStarterPackContractAddress } from '../../constants';

import {
  generateNftStarterPackImage,
  generateNftStarterPackCongrats,
  updateNftStarterPackImage
} from './generateStarterPackNftImage';

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

export async function uploadStarterPackArtwork({
  imageHostingBaseUrl,
  avatar,
  tokenId,
  season,
  displayName,
  currentNftImage
}: {
  imageHostingBaseUrl?: string;
  displayName: string;
  season: string;
  avatar: string | null;
  tokenId: bigint | number;
  currentNftImage?: string;
}) {
  const imageBuffer = currentNftImage
    ? await updateNftStarterPackImage({
        displayName,
        currentNftImage
      })
    : await generateNftStarterPackImage({
        avatar,
        displayName,
        imageHostingBaseUrl
      });

  const imagePath = getNftTokenUrlPath({
    season,
    tokenId: Number(tokenId),
    filename: 'starter-pack-artwork.png',
    contractName: getBuilderStarterPackContractAddress()
  });

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

export async function uploadStarterPackArtworkCongrats({
  imageHostingBaseUrl,
  season,
  tokenId,
  userImage,
  builderId
}: {
  imageHostingBaseUrl?: string;
  season: string;
  tokenId: bigint | number;
  userImage: string | null;
  builderId: string;
}) {
  const activities = await getBuilderActivities({ builderId, limit: 3 });
  const stats = await getBuilderStats(builderId);
  const builderScouts = await getBuilderScouts(builderId);
  const builderNft = await getBuilderNft(builderId);

  const imageBuffer = await generateNftStarterPackCongrats({
    userImage,
    imageHostingBaseUrl,
    activities,
    stats,
    builderScouts,
    builderPrice: builderNft?.currentPrice || BigInt(0)
  });

  const imagePath = getNftCongratsPath({
    season,
    tokenId: Number(tokenId),
    starterPack: true,
    contractName: getBuilderStarterPackContractAddress()
  });

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
