import { prisma } from '@charmverse/core/prisma-client';
import { uploadFileToS3 } from '@root/lib/aws/uploadToS3Server';

import { currentSeason } from '../utils';

import { builderApiClient } from './builderApiClient';
import { builderContractAddress, builderNftChain } from './constants';
import { generateNftImage } from './generateNftImage';

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
  const currentPrice = await builderApiClient.getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });

  // TODO: Use a fallback avatar if none is provided
  const imageBuffer = await generateNftImage({
    avatar,
    username
  });

  const s3Key = `nfts/${builderId}-${avatar?.split('/').pop()}`;
  const { fileUrl: imageUrl } = await uploadFileToS3({
    content: imageBuffer,
    pathInS3: s3Key,
    contentType: 'image/png'
  });

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress,
      tokenId: Number(tokenId),
      season: currentSeason,
      currentPrice,
      imageUrl
    }
  });

  return builderNft;
}
