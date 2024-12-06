import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { builderNftArtworkContractName } from './constants';
import { generateArtwork, updateArtwork } from './generateArtwork';
import { getNftTokenUrlPath, imageDomain } from './utils';

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

  const imagePath = getNftTokenUrlPath({
    season,
    tokenId: Number(tokenId),
    filename: 'artwork.png',
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
