import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { recordGameActivity } from '../recordGameActivity';

import { builderContractAddress, builderNftChain } from './constants';
import { getBuilderContractAdminClient } from './contractClient';
import { refreshBuilderNftPrice } from './refreshBuilderNftPrice';

export async function registerBuilderNFT({ builderId, season }: { builderId: string; season: string }) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId. Must be a uuid');
  }

  const contractClient = getBuilderContractAdminClient();

  const existingBuilderNft = await prisma.builderNft.findFirst({
    where: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress,
      season
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
      githubUser: true,
      builderStatus: true
    }
  });

  if (!builder.githubUser) {
    throw new InvalidInputError('Scout profile does not have a github user');
  }

  if (builder.builderStatus !== 'approved') {
    throw new InvalidInputError('Scout profile not marked as a builder');
  }

  let existingTokenId = await contractClient.getTokenIdForBuilder({ args: { builderId } }).catch(() => null);

  if (!existingTokenId) {
    log.info(`Registering builder token for builderId: ${builderId}`);
    await contractClient.registerBuilderToken({ args: { builderId } });
    existingTokenId = await contractClient.getTokenIdForBuilder({ args: { builderId } });
  }

  const nftWithRefreshedPrice = await refreshBuilderNftPrice({ builderId, season });

  await prisma.scout.update({
    where: {
      id: builderId
    },
    data: {
      builderStatus: 'approved'
    }
  });

  await recordGameActivity({
    activity: {
      amount: 1,
      pointsDirection: 'in',
      userId: builderId
    },
    sourceEvent: {
      registeredBuilderNftId: nftWithRefreshedPrice.id
    }
  });

  log.info(`Last price: ${nftWithRefreshedPrice.currentPrice}`);

  return nftWithRefreshedPrice;
}
