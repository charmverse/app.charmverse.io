import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { builderContractReadonlyApiClient } from '../clients/builderContractReadClient';
import { getBuilderContractStarterPackMinterClient } from '../clients/builderContractStarterPackMinterWriteClient';
import { builderContractStarterPackReadonlyApiClient } from '../clients/builderContractStarterPackReadClient';
import { builderNftChain } from '../constants';

import { createBuilderNftStarterPack } from './createBuilderNftStarterPack';

export async function registerBuilderStarterPackNFT({
  builderId,
  season,
  imageHostingBaseUrl
}: {
  builderId: string;
  season: string;
  imageHostingBaseUrl?: string;
}) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError(`Invalid builderId. Must be a uuid: ${builderId}`);
  }

  const existingBuilderNft = await prisma.builderNft.findFirst({
    where: {
      builderId,
      chainId: builderNftChain.id,
      season,
      nftType: 'starter_pack'
    }
  });

  if (existingBuilderNft) {
    return existingBuilderNft;
  }

  const builder = await prisma.scout.findFirstOrThrow({
    where: {
      id: builderId
    },
    select: {
      githubUser: true,
      avatar: true,
      path: true,
      displayName: true,
      builderStatus: true
    }
  });

  if (!builder.githubUser) {
    throw new InvalidInputError('Scout profile does not have a github user');
  }

  // Read the tokenId from the existing builder NFT Contract so that they match
  const tokenId = await builderContractReadonlyApiClient.getTokenIdForBuilder({
    args: { builderId }
  });

  if (!tokenId) {
    throw new InvalidInputError('Builder NFT not found');
  }

  const existingStarterPackTokenId = await builderContractStarterPackReadonlyApiClient
    .getTokenIdForBuilder({
      args: { builderId }
    })
    .catch(() => null);

  if (existingStarterPackTokenId && existingStarterPackTokenId !== tokenId) {
    throw new InvalidInputError('Builder NFT already registered on starter pack contract but with a different tokenId');
  } else if (!existingStarterPackTokenId) {
    // Register the builder token on the starter pack contract so that it can be minted
    await getBuilderContractStarterPackMinterClient().registerBuilderToken({
      args: { builderId, builderTokenId: tokenId }
    });
  }

  const builderNft = await createBuilderNftStarterPack({
    imageHostingBaseUrl,
    tokenId,
    builderId,
    avatar: builder.avatar,
    path: builder.path!,
    displayName: builder.displayName
  });

  log.info(`Registered builder NFT starter pack for builder`, {
    userId: builderId,
    builderPath: builder.path,
    tokenId,
    season,
    nftType: 'starter_pack'
  });

  return builderNft;
}
