import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { getBuilderContractAdminClient } from './clients/builderContractAdminWriteClient';
import { builderContractReadonlyApiClient } from './clients/builderContractReadClient';

export async function refreshBuilderNftPrice({ builderId, season }: { builderId: string; season: string }) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId. Must be a uuid');
  }

  const contractClient = getBuilderContractAdminClient();

  const tokenId = await contractClient.getTokenIdForBuilder({ args: { builderId } });

  const currentPrice = await builderContractReadonlyApiClient.getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });

  return prisma.builderNft.update({
    where: {
      builderId_season: {
        builderId,
        season
      }
    },
    data: {
      currentPrice: Number(currentPrice)
    }
  });
}
