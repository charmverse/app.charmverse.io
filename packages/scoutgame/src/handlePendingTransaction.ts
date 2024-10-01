'use server';

import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { PointsDirection, prisma, TransactionStatus } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import {
  DecentTxFailedPermanently,
  waitForDecentTransactionSettlement
} from '@packages/onchain/waitForDecentTransactionSettlement';
import { builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { recordGameActivity } from '@packages/scoutgame/recordGameActivity';

import { getBuilderContractAdminClient } from './builderNfts/clients/builderContractAdminWriteClient';

export async function handlePendingTransaction({
  pendingTransactionId
}: {
  pendingTransactionId: string;
}): Promise<void> {
  if (!stringUtils.isUUID(pendingTransactionId)) {
    throw new InvalidInputError(`Pending transaction id must be a valid uuid`);
  }

  // Atomically set the status to 'processing' only if it's currently 'pending'
  const updatedTx = await prisma.pendingNftTransaction.updateMany({
    where: {
      id: pendingTransactionId,
      status: 'pending'
    },
    data: {
      status: 'processing'
    }
  });

  if (updatedTx.count === 0) {
    log.info('Skip processing tx as it is locked');
    // The transaction is already being processed or completed, so exit
    return;
  }

  try {
    // Fetch the pending transaction
    const pendingTx = await prisma.pendingNftTransaction.findUniqueOrThrow({
      where: {
        id: pendingTransactionId
      }
    });

    if (pendingTx.status !== 'pending') {
      log.info(`Skipping processing for tx id ${pendingTx.id}`);
      return;
    }

    // Fetch the builder NFT
    const builderNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        chainId: pendingTx.destinationChainId,
        contractAddress: pendingTx.contractAddress.toLowerCase()
      }
    });

    const apiClient = getBuilderContractAdminClient();

    // Wait for transaction settlement without updating status
    const txHash = await waitForDecentTransactionSettlement({
      sourceTxHash: pendingTx.sourceChainTxHash.toLowerCase(),
      sourceTxHashChainId: pendingTx.sourceChainId
    });

    // Proceed with minting
    const txResult = await apiClient.mintTo({
      args: {
        account: pendingTx.senderAddress,
        tokenId: pendingTx.tokenId,
        amount: BigInt(pendingTx.tokenAmount),
        scout: pendingTx.userId
      }
    });

    const nftEvent = await prisma.nFTPurchaseEvent.create({
      data: {
        pointsValue: 0,
        tokensPurchased: pendingTx.tokenAmount,
        txHash: txResult.transactionHash.toLowerCase(),
        builderNftId: builderNft.id,
        scoutId: pendingTx.userId,
        builderEvent: {
          create: {
            type: 'nft_purchase',
            season: currentSeason,
            week: getCurrentWeek(),
            builder: {
              connect: {
                id: pendingTx.userId
              }
            }
          }
        }
      }
    });

    await refreshBuilderNftPrice({ builderId: builderNft.builderId, season: currentSeason });

    await recordGameActivity({
      sourceEvent: {
        nftPurchaseEventId: nftEvent.id,
        onchainTxHash: txResult.transactionHash,
        onchainChainId: builderNftChain.id
      },
      activity: {
        pointsDirection: PointsDirection.out,
        userId: builderNft.builderId,
        amount: pendingTx.tokenAmount
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
        amount: pendingTx.tokenAmount
      }
    });

    // Update the pending transaction status to 'completed' and set destination details
    await prisma.pendingNftTransaction.update({
      where: {
        id: pendingTransactionId
      },
      data: {
        status: TransactionStatus.completed,
        destinationChainId: pendingTx.destinationChainId,
        destinationChainTxHash: txHash.toLowerCase()
      }
    });
  } catch (error) {
    if (error instanceof DecentTxFailedPermanently) {
      await prisma.pendingNftTransaction.update({
        where: {
          id: pendingTransactionId
        },
        data: {
          status: TransactionStatus.failed
        }
      });
      throw error; // Rethrow the error after updating the status
    } else {
      // Update the pending transaction status to 'failed'
      await prisma.pendingNftTransaction.update({
        where: {
          id: pendingTransactionId
        },
        data: {
          status: TransactionStatus.pending
        }
      });
      throw error; // Rethrow the error after updating the status
    }
  }
}
