import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

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

  await uploadFileToS3({
    pathInS3: `nft/${imagePath}`,
    bucket: process.env.SCOUTGAME_S3_BUCKET,
    content: imageBuffer,
    contentType: 'image/png'
  });

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

  await uploadFileToS3({
    pathInS3: `nft/${imagePath}`,
    bucket: process.env.SCOUTGAME_S3_BUCKET,
    content: imageBuffer,
    contentType: 'image/png'
  });

  return `${imageDomain}/${imagePath}`;
}
