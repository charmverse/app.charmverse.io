import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { getBuilderContractMinterClient } from '../clients/builderContractMinterWriteClient';
import { builderNftChain } from '../constants';
import { refreshBuilderNftPrice } from '../refreshBuilderNftPrice';

import { createBuilderNft } from './createBuilderNft';

export async function registerBuilderNFT({
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

  const contractClient = getBuilderContractMinterClient();

  const existingBuilderNft = await prisma.builderNft.findFirst({
    where: {
      builderId,
      chainId: builderNftChain.id,
      season,
      nftType: BuilderNftType.default
    }
  });

  if (existingBuilderNft) {
    log.info(`Builder already existing with token id ${existingBuilderNft.tokenId}`);
    const updatedBuilderNft = await refreshBuilderNftPrice({ builderId, season });
    return updatedBuilderNft;
  }

  const builder = await prisma.scout.findFirstOrThrow({
    where: {
      id: builderId
    },
    select: {
      githubUsers: true,
      avatar: true,
      path: true,
      displayName: true,
      builderStatus: true
    }
  });

  if (!builder.githubUsers[0]) {
    throw new InvalidInputError('Scout profile does not have a github user');
  }

  let tokenId = await contractClient.getTokenIdForBuilder({ args: { builderId } }).catch(() => null);

  if (!tokenId) {
    log.info(`Registering builder token for builder`, { userId: builderId });
    await contractClient.registerBuilderToken({ args: { builderId } });
    tokenId = await contractClient.getTokenIdForBuilder({ args: { builderId } });
  }

  const builderNft = await createBuilderNft({
    imageHostingBaseUrl,
    tokenId,
    builderId,
    avatar: builder.avatar,
    path: builder.path!,
    displayName: builder.displayName
  });

  log.info(`Registered builder NFT for builder`, {
    userId: builderId,
    builderPath: builder.path,
    tokenId,
    season
  });

  return builderNft;
}
