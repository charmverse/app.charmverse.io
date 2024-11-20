import { prisma } from '@charmverse/core/prisma-client';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';
import { savePendingTransaction } from '../savePendingTransaction';

import { optimismUsdcContractAddress, realOptimismMainnetBuildersContract } from './constants';
import { getOnchainPurchaseEvents } from './getOnchainPurchaseEvents';
import { getTokenPurchasePrice } from './getTokenPurchasePrice';
import { handlePendingTransaction } from './handlePendingTransaction';

export async function syncUserNFTsFromOnchainData({
  path,
  scoutId,
  fromBlock
}: {
  path?: string;
  scoutId?: string;
  fromBlock?: number;
}): Promise<void> {
  if (!path && !scoutId) {
    throw new Error('Either path or scoutId must be provided');
  } else if (path && scoutId) {
    throw new Error('Only one of path or scoutId can be provided');
  }

  const scout = await prisma.scout.findFirstOrThrow({
    where: {
      id: scoutId,
      path
    },
    select: {
      id: true
    }
  });

  const userPurchases = await getOnchainPurchaseEvents({ scoutId: scout.id, fromBlock });

  const txRequiringReconciliation = userPurchases.filter((p) => !p.nftPurchase);

  for (let i = 0; i < txRequiringReconciliation.length; i++) {
    const txToReconcile = txRequiringReconciliation[i];

    scoutgameMintsLogger.error(`Processing missing txToReconcile ${i + 1} / ${txRequiringReconciliation.length}`, {
      sourceTransaction: txToReconcile.pendingTransaction?.sourceChainTxHash,
      sourceChain: txToReconcile.pendingTransaction?.sourceChainId,
      optimismTxHash: txToReconcile.txHash,
      tokenId: txToReconcile.tokenId,
      scoutId: txToReconcile.scoutId,
      tokensToPurchase: txToReconcile.amount
    });
    const expectedPrice =
      txToReconcile.pendingTransaction?.targetAmountReceived ??
      (await getTokenPurchasePrice({
        args: {
          amount: BigInt(txToReconcile.amount),
          tokenId: BigInt(txToReconcile.tokenId)
        },
        blockNumber: BigInt(txToReconcile.blockNumber) - BigInt(1)
      }));

    if (!txToReconcile.pendingTransaction) {
      scoutgameMintsLogger.error('No pending transaction found for txToReconcile', {
        scoutId: txToReconcile.scoutId,
        tokenId: txToReconcile.tokenId,
        tokensToPurchase: txToReconcile.amount
      });
    }
    const pendingTx =
      txToReconcile.pendingTransaction ??
      (await savePendingTransaction({
        user: {
          scoutId: scout.id,
          walletAddress: txToReconcile.transferEvent.to
        },
        transactionInfo: {
          destinationChainId: 10,
          sourceChainId: 10,
          sourceChainTxHash: txToReconcile.txHash
        },
        purchaseInfo: {
          quotedPriceCurrency: optimismUsdcContractAddress,
          builderContractAddress: realOptimismMainnetBuildersContract,
          tokenId: Number(txToReconcile.tokenId),
          quotedPrice: Number(expectedPrice),
          tokenAmount: Number(txToReconcile.amount)
        }
      }));

    await handlePendingTransaction({ pendingTransactionId: pendingTx.id });
  }
}
