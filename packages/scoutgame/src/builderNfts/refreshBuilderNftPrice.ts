import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { currentSeason } from '@packages/scoutgame/utils';
import { getPublicClient } from '@root/lib/blockchain/publicClient';

import { builderContractAddress, builderNftChain } from './constants';
import { ContractApiClient } from './nftContractApiClient';

const builderApiClient = new ContractApiClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  publicClient: getPublicClient(builderNftChain.id)
});

export async function refreshBuilderNftPrice({ builderId }: { builderId: string }) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId. Must be a uuid');
  }

  const tokenId = await builderApiClient.getTokenIdForBuilder({ args: { builderId } });

  const currentPrice = await builderApiClient.getTokenPurchasePrice({
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
      currentPrice
    },
    update: {
      currentPrice
    }
  });
}
