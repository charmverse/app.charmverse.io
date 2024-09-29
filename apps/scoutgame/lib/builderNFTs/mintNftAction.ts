'use server';

import { log } from '@charmverse/core/log';
import { PointsDirection, prisma } from '@charmverse/core/prisma-client';
import { sleep } from '@decent.xyz/box-common';
import { waitForDecentTransactionSettlement } from '@packages/onchain/waitForDecentTransactionSettlement';
import { BuilderNFTSeasonOneClient } from '@packages/scoutgame/builderNfts/builderNFTSeasonOneClient';
import {
  builderContractAddress,
  builderNftChain,
  builderSmartContractOwnerKey
} from '@packages/scoutgame/builderNfts/constants';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { recordGameActivity } from '@packages/scoutgame/recordGameActivity';
import { GET } from '@root/adapters/http';
import { getWalletClient } from '@root/lib/blockchain/walletClient';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const mintNftAction = authActionClient
  .metadata({ actionName: 'mint-nft' })
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
      sourceTxChainId: yup.number().required(),
      tokenId: yup.string().required(),
      amount: yup.number().required(),
      builderId: yup.string().required(),
      txHash: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = await getUserFromSession().then((u) => u?.id);

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

    const txHash = await waitForDecentTransactionSettlement({
      sourceTxHash: parsedInput.txHash,
      sourceTxHashChainId: parsedInput.sourceTxChainId
    });

    const txResult = await apiClient.mintTo({
      args: {
        account: parsedInput.address,
        tokenId: BigInt(parsedInput.tokenId),
        amount: BigInt(parsedInput.amount),
        scout: userId
      }
    });

    const nftEvent = await prisma.nFTPurchaseEvent.create({
      data: {
        // Assuming constant conversion rate of 4:1, and 6 decimals on USDC
        pointsValue: 0,
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
      },
      include: {}
    });

    const pointsValue = Number(nextPrice) / 5;

    await refreshBuilderNftPrice({ builderId: parsedInput.builderId, season: currentSeason });

    await recordGameActivity({
      sourceEvent: {
        nftPurchaseEventId: nftEvent.id,
        onchainTxHash: txResult.transactionHash,
        onchainChainId: builderNftChain.id
      },
      activity: {
        pointsDirection: PointsDirection.out,
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
        pointsDirection: PointsDirection.in,
        userId: builderNft.builderId,
        amount: parsedInput.amount
      }
    });

    return { success: true };
  });
