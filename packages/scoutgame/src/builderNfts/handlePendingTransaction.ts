'use server';

import { InvalidInputError } from '@charmverse/core/errors';
import { prisma, TransactionStatus } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import {
  DecentTxFailedPermanently,
  waitForDecentTransactionSettlement
} from '@packages/blockchain/waitForDecentTransactionSettlement';

import { currentSeason } from '../dates';
import { scoutgameMintsLogger } from '../loggers/mintsLogger';

import { recordNftMint } from './recordNftMint';
import { convertCostToPoints } from './utils';
import { validateMint } from './validateMint';

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
    scoutgameMintsLogger.info('Skip processing tx as it is locked', { pendingTransactionId });
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

    if (pendingTx.status !== 'processing') {
      scoutgameMintsLogger.info(`Skipping processing for tx id ${pendingTx.id}`);
      return;
    }

    // Fetch the builder NFT
    const builderNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        season: currentSeason,
        tokenId: Number(pendingTx.tokenId)
      }
    });
    const txHash =
      pendingTx.destinationChainId === pendingTx.sourceChainId
        ? pendingTx.sourceChainTxHash
        : await waitForDecentTransactionSettlement({
            sourceTxHash: pendingTx.sourceChainTxHash.toLowerCase(),
            sourceTxHashChainId: pendingTx.sourceChainId
          });

    const validatedMint = await validateMint({
      chainId: pendingTx.destinationChainId,
      txHash
    });

    if (!validatedMint) {
      scoutgameMintsLogger.error(`Transaction on chain ${pendingTx.destinationChainId} failed`, {
        userId: pendingTx.userId
      });
      throw new DecentTxFailedPermanently();
    } else {
      // Update the pending transaction status to 'completed' and set destination details
      await prisma.pendingNftTransaction.update({
        where: {
          id: pendingTransactionId
        },
        data: {
          status: TransactionStatus.completed,
          destinationChainTxHash: txHash.toLowerCase()
        }
      });

      await recordNftMint({
        amount: pendingTx.tokenAmount,
        builderNftId: builderNft.id,
        mintTxHash: txHash,
        paidWithPoints: false,
        pointsValue: convertCostToPoints(pendingTx.targetAmountReceived),
        recipientAddress: pendingTx.senderAddress,
        scoutId: pendingTx.userId
      });
    }
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
