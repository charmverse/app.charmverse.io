import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { getBuilderContractMinterClient } from './clients/builderContractMinterWriteClient';
import { builderContractReadonlyApiClient } from './clients/builderContractReadClient';

export async function refreshBuilderNftPrice({ builderId, season }: { builderId: string; season: string }) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId. Must be a uuid');
  }

  const contractClient = getBuilderContractMinterClient();

  const tokenId = await contractClient.getTokenIdForBuilder({ args: { builderId } });

  const currentPrice = await builderContractReadonlyApiClient.getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });
  const existingNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      builderId,
      season
    }
  });

  return prisma.builderNft.update({
    where: {
      id: existingNft.id
    },
    data: {
      currentPrice: Number(currentPrice)
    }
  });
}
