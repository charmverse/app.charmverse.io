import { InvalidInputError } from '@charmverse/core/errors';
import type { BuilderNft } from '@charmverse/core/prisma';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';

import { getBuilderContractMinterClient } from './clients/builderContractMinterWriteClient';
import { builderContractReadonlyApiClient } from './clients/builderContractReadClient';

export async function refreshBuilderNftPrice({
  builderId,
  season
}: {
  builderId: string;
  season: string;
}): Promise<BuilderNft> {
  try {
    if (!stringUtils.isUUID(builderId)) {
      throw new InvalidInputError(`Invalid builderId. Must be a uuid: ${builderId}`);
    }

    const contractClient = getBuilderContractMinterClient();

    const tokenId = await contractClient.getTokenIdForBuilder({ args: { builderId } });

    const currentPrice = await builderContractReadonlyApiClient.getTokenPurchasePrice({
      args: { tokenId, amount: BigInt(1) }
    });
    const existingNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        builderId,
        season,
        nftType: BuilderNftType.default
      }
    });

    const updatedNft = await prisma.builderNft.update({
      where: {
        id: existingNft.id
      },
      data: {
        currentPrice: Number(currentPrice)
      }
    });

    return updatedNft;
  } catch (error) {
    scoutgameMintsLogger.error('Error refreshing builder nft price', { builderId, season, error });
    throw error;
  }
}
