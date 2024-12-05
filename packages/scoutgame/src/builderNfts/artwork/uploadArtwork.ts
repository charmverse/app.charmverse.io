import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { getBuilderActivities } from '../../builders/getBuilderActivities';
import { getBuilderNft } from '../../builders/getBuilderNft';
import { getBuilderScouts } from '../../builders/getBuilderScouts';
import { getBuilderStats } from '../../builders/getBuilderStats';

import { generateArtwork, generateNftCongrats, updateArtwork } from './generateArtwork';
import { getNftCongratsPath, getNftTokenUrlPath, imageDomain } from './utils';

export async function uploadArtwork({
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
    ? await updateArtwork({
        displayName,
        currentNftImage
      })
    : await generateArtwork({
        avatar,
        displayName,
        imageHostingBaseUrl
      });

  const imagePath = getNftTokenUrlPath({ season, tokenId: Number(tokenId), filename: 'artwork.png' });

  await uploadFileToS3({
    pathInS3: `nft/${imagePath}`,
    bucket: process.env.SCOUTGAME_S3_BUCKET,
    content: imageBuffer,
    contentType: 'image/png'
  });

  return `${imageDomain}/${imagePath}`;
}
