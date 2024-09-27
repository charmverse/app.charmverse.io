import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { getPublicClient } from '@packages/onchain/getPublicClient';

import { currentSeason } from '../dates';

import { BuilderNFTSeasonOneClient } from './builderNFTSeasonOneClient';
import { builderContractAddress, builderNftChain } from './constants';

const builderApiClient = new BuilderNFTSeasonOneClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  publicClient: getPublicClient(builderNftChain.id)
});

export async function refreshBuilderNftPrice({ builderId }: { builderId: string }) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId. Must be a uuid');
  }

  const tokenId = await builderApiClient.getTokenIdForBuilder({ args: { builderId } });

  const currentPrice = await builderApiClient.getTokenQuote({
    args: { tokenId, amount: BigInt(1) }
  });

  return prisma.builderNft.upsert({
    where: {
      builderId_season: {
        builderId,
        season: currentSeason
      }
    },
    create: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress,
      tokenId: Number(tokenId),
      season: currentSeason,
      currentPrice: Number(currentPrice)
    },
    update: {
      currentPrice: Number(currentPrice)
    }
  });
}
