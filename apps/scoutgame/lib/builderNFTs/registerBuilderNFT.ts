import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { currentSeason } from '@packages/scoutgame/utils';
import { getWalletClient } from '@root/lib/blockchain/walletClient';

import { builderNftChain, builderContractAddress } from './constants';
import { ContractApiClient } from './nftContractApiClient';

const builderNftWriteApiClient = new ContractApiClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  walletClient: getWalletClient({ chainId: builderNftChain.id, privateKey: process.env.PRIVATE_KEY })
});

export async function registerBuilderNFT({ builderId }: { builderId: string }) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId. Must be a uuid');
  }

  const existingBuilderNft = await prisma.builderNft.findFirst({
    where: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress,
      season: currentSeason
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
      builder: true
    }
  });

  if (!builder.githubUser) {
    throw new InvalidInputError('Scout profile does not have a github user');
  }

  if (!builder.builder) {
    throw new InvalidInputError('Scout profile not marked as a builder');
  }

  let existingTokenId = await builderNftWriteApiClient.getTokenIdForBuilder({ args: { builderId } }).catch(() => null);

  if (!existingTokenId) {
    await builderNftWriteApiClient.registerBuilderToken({ args: { builderId } });
    existingTokenId = await builderNftWriteApiClient.getTokenIdForBuilder({ args: { builderId } });
  }

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress,
      tokenId: Number(existingTokenId),
      season: currentSeason
    }
  });
}
