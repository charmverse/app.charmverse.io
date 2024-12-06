import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { getBuilderActivities } from '../../builders/getBuilderActivities';
import { getBuilderNft } from '../../builders/getBuilderNft';
import { getBuilderScouts } from '../../builders/getBuilderScouts';
import { getBuilderStats } from '../../builders/getBuilderStats';

import { builderNftArtworkContractName } from './constants';
import { generateShareImage } from './generateShareImage';
import { getShareImagePath, imageDomain } from './utils';

export async function uploadShareImage({
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
  const [activities, stats, builderScouts, builderNft] = await Promise.all([
    getBuilderActivities({ builderId, limit: 3 }),
    getBuilderStats(builderId),
    getBuilderScouts(builderId),
    getBuilderNft(builderId)
  ]);
  // Just for testing
  // const activities = await getBuilderActivities({ builderId: '745c9ffd-278f-4e91-8b94-beaded2ebcd1', limit: 3 });
  // const stats = await getBuilderStats('745c9ffd-278f-4e91-8b94-beaded2ebcd1');
  // const builderScouts = await getBuilderScouts('745c9ffd-278f-4e91-8b94-beaded2ebcd1');
  // const builderNft = await getBuilderNft('745c9ffd-278f-4e91-8b94-beaded2ebcd1');

  const imageBuffer = await generateShareImage({
    userImage,
    imageHostingBaseUrl,
    activities,
    stats,
    builderScouts,
    builderPrice: builderNft?.currentPrice || BigInt(0)
  });

  const imagePath = getShareImagePath({
    season,
    tokenId: Number(tokenId),
    contractName: builderNftArtworkContractName
  });

  await uploadFileToS3({
    pathInS3: `nft/${imagePath}`,
    bucket: process.env.SCOUTGAME_S3_BUCKET,
    content: imageBuffer,
    contentType: 'image/png'
  });

  return `${imageDomain}/${imagePath}`;
}
