import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { currentSeason } from '@packages/scoutgame/utils';

import { builderApiClient } from './builderApiClient';

export async function refreshBuilderNftPrice({ builderId }: { builderId: string }) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId. Must be a uuid');
  }

  const tokenId = await builderApiClient.getTokenIdForBuilder({ args: { builderId } });

  const currentPrice = await builderApiClient.getTokenPurchasePrice({
    args: { tokenId, amount: BigInt(1) }
  });

  return prisma.builderNft.update({
    where: {
      builderId_season: {
        builderId,
        season: currentSeason
      }
    },
    data: {
      currentPrice
    }
  });
}
