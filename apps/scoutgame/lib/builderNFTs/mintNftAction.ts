'use server';

import { PointsDirection, prisma } from '@charmverse/core/prisma-client';
import { BuilderNFTSeasonOneClient } from '@packages/scoutgame/builderNfts/builderNFTSeasonOneClient';
import {
  builderContractAddress,
  builderNftChain,
  builderSmartContractOwnerKey
} from '@packages/scoutgame/builderNfts/constants';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { recordGameActivity } from '@packages/scoutgame/recordGameActivity';
import { getWalletClient } from '@root/lib/blockchain/walletClient';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

export const mintNftAction = authActionClient
  .metadata({ actionName: 'save-onboarded' })
  .schema(
    yup.object().shape({
      address: yup
        .string()
        .required()
        .test('Valid address', (v) => {
          if (!isAddress(v)) {
            return false;
          }
          return true;
        }),
      tokenId: yup.string().required(),
      amount: yup.number().required(),
      builderId: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = ctx.session.user?.id;

    if (!userId) {
      throw new Error('User not found');
    }

    const builderNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        chainId: builderNftChain.id,
        contractAddress: builderContractAddress
      }
    });

    const serverClient = getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractOwnerKey });

    const apiClient = new BuilderNFTSeasonOneClient({
      chain: builderNftChain,
      contractAddress: builderContractAddress,
      walletClient: serverClient
    });

    const nextPrice = await apiClient.getTokenQuote({
      args: {
        tokenId: BigInt(parsedInput.tokenId),
        amount: BigInt(parsedInput.amount)
      }
    });

    const txResult = await apiClient.mintTo({
      args: {
        account: parsedInput.address,
        tokenId: BigInt(parsedInput.tokenId),
        amount: BigInt(parsedInput.amount),
        scout: userId
      }
    });

    // TODO - Add the points TX && refresh the points stats for the builder

    const nftEvent = await prisma.nFTPurchaseEvent.create({
      data: {
        // Assuming constant conversion rate of 4:1, and 6 decimals on USDC
        pointsValue: Number(nextPrice) / 10e6 / 4,
        tokensPurchased: parsedInput.amount,
        txHash: txResult.transactionHash,
        builderNftId: builderNft.id,
        scoutId: userId,
        builderEvent: {
          create: {
            type: 'nft_purchase',
            season: currentSeason,
            week: getCurrentWeek(),
            builder: {
              connect: {
                id: userId
              }
            }
          }
        }
      }
    });

    await refreshBuilderNftPrice({ builderId: parsedInput.builderId });

    await recordGameActivity({
      sourceEvent: {
        nftPurchaseEventId: nftEvent.id,
        onchainTxHash: txResult.transactionHash,
        onchainChainId: builderNftChain.id
      },
      activity: {
        pointsDirection: PointsDirection.in,
        userId,
        amount: parsedInput.amount
      }
    });

    await recordGameActivity({
      sourceEvent: {
        nftPurchaseEventId: nftEvent.id,
        onchainTxHash: txResult.transactionHash,
        onchainChainId: builderNftChain.id
      },
      activity: {
        pointsDirection: PointsDirection.out,
        userId: builderNft.builderId,
        amount: parsedInput.amount
      }
    });

    return { success: true };
  });
