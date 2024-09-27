import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { getPublicClient } from '@packages/onchain/getPublicClient';

import { BuilderNFTSeasonOneClient } from './builderNFTSeasonOneClient';
import { builderContractAddress, builderNftChain } from './constants';
import { getContractClient } from './contractClient';

const builderApiClient = new BuilderNFTSeasonOneClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  publicClient: getPublicClient(builderNftChain.id)
});

export async function refreshBuilderNftPrice({ builderId, season }: { builderId: string; season: string }) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId. Must be a uuid');
  }

  const contractClient = getContractClient();

  const tokenId = await contractClient.getTokenIdForBuilder({ args: { builderId } });

  const currentPrice = await builderApiClient.getTokenQuote({
    args: { tokenId, amount: BigInt(1) }
  });

  return prisma.builderNft.upsert({
    where: {
      builderId_season: {
        builderId,
        season
      }
    },
    create: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress,
      tokenId: Number(tokenId),
      season,
      currentPrice
    },
    update: {
      currentPrice: Number(currentPrice)
    }
  });
}
