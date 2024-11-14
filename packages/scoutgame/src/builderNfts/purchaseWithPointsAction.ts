'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { revalidatePath } from 'next/cache';

import { authActionClient } from '../actions/actionClient';
import { currentSeason } from '../dates';

import { builderContractReadonlyApiClient } from './clients/builderContractReadClient';
import { mintNFT } from './mintNFT';
import { schema } from './purchaseWithPointsSchema';
import { convertCostToPoints } from './utils';

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
    const pointsValue = convertCostToPoints(currentPrice);
    if (scout.currentBalance < pointsValue) {
      throw new Error('Insufficient points');
    }

    log.info(`Triggering NFT mint via admin wallet`, {
      builderNftId: builderNft.id,
      recipientAddress: parsedInput.recipientAddress,
      amount: parsedInput.amount,
      scoutId: ctx.session.scoutId,
      pointsValue
    });
    await mintNFT({
      builderNftId: builderNft.id,
      recipientAddress: parsedInput.recipientAddress,
      amount: parsedInput.amount,
      scoutId: ctx.session.scoutId as string,
      paidWithPoints: true,
      pointsValue
    });

    revalidatePath('/', 'layout');
    return { success: true };
  });
