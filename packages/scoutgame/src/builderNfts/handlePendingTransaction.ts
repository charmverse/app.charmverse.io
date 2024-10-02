'use server';

import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma, TransactionStatus } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { getPublicClient } from '@packages/onchain/getPublicClient';
import {
  DecentTxFailedPermanently,
  waitForDecentTransactionSettlement
} from '@packages/onchain/waitForDecentTransactionSettlement';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { currentSeason } from '@packages/scoutgame/dates';

import { mintNFT } from './mintNFT';
import { convertCostToPoints } from './utils';

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
      id: pendingTransactionId
      // status: 'pending'
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

    if (pendingTx.status !== 'processing') {
      log.info(`Skipping processing for tx id ${pendingTx.id}`);
      return;
    }

    // Fetch the builder NFT
    const builderNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        season: currentSeason,
        tokenId: Number(pendingTx.tokenId)
      }
    });

    if (pendingTx.destinationChainId === pendingTx.sourceChainId) {
      const receipt = await getPublicClient(pendingTx.destinationChainId).waitForTransactionReceipt({
        hash: pendingTx.sourceChainTxHash as `0x${string}`
      });

      // Proceed with minting
      await mintNFT({
        builderNftId: builderNft.id,
        recipientAddress: pendingTx.senderAddress,
        amount: pendingTx.tokenAmount,
        scoutId: pendingTx.userId,
        paidWithPoints: false,
        pointsValue: convertCostToPoints(pendingTx.targetAmountReceived)
      });

      await prisma.pendingNftTransaction.update({
        where: {
          id: pendingTransactionId
        },
        data: {
          status: TransactionStatus.completed,
          destinationChainTxHash: pendingTx.sourceChainTxHash.toLowerCase()
        }
      });

      await refreshBuilderNftPrice({ builderId: builderNft.builderId, season: currentSeason });

      return;
    }

    // Wait for transaction settlement without updating status
    const txHash = await waitForDecentTransactionSettlement({
      sourceTxHash: pendingTx.sourceChainTxHash.toLowerCase(),
      sourceTxHashChainId: pendingTx.sourceChainId
    });

    // Proceed with minting
    await mintNFT({
      builderNftId: builderNft.id,
      recipientAddress: pendingTx.senderAddress,
      amount: pendingTx.tokenAmount,
      scoutId: pendingTx.userId,
      paidWithPoints: false,
      pointsValue: convertCostToPoints(pendingTx.targetAmountReceived)
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
