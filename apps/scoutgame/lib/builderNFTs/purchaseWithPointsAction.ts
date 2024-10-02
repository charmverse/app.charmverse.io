'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { builderContractReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractReadClient';
import { mintNFT } from '@packages/scoutgame/builderNfts/mintNFT';
import { convertCostToPointsWithDiscount } from '@packages/scoutgame/builderNfts/utils';
import { currentSeason } from '@packages/scoutgame/dates';

import { authActionClient } from 'lib/actions/actionClient';

import { schema } from './purchaseWithPointsSchema';

export const purchaseWithPointsAction = authActionClient
  .metadata({ actionName: 'purchase_with_points' })
  .schema(schema)
  .action(async ({ ctx, parsedInput }) => {
    const [builderNft, scout] = await Promise.all([
      prisma.builderNft.findFirstOrThrow({
        where: {
          builderId: parsedInput.builderId,
          season: currentSeason
        }
      }),
      prisma.scout.findFirstOrThrow({
        where: {
          id: ctx.session.scoutId
        }
      })
    ]);
    const currentPrice = await builderContractReadonlyApiClient.getTokenPurchasePrice({
      args: { tokenId: BigInt(builderNft.tokenId), amount: BigInt(parsedInput.amount) }
    });
    const pointsValue = convertCostToPointsWithDiscount(currentPrice);
    if (scout.currentBalance < pointsValue) {
      throw new Error('Insufficient points');
    }
    await mintNFT({
      builderNftId: builderNft.id,
      recipientAddress: parsedInput.recipientAddress,
      amount: parsedInput.amount,
      scoutId: ctx.session.scoutId,
      paidWithPoints: true,
      pointsValue
    });
    return { success: true };
  });
