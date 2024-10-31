import type { PendingNftTransaction, TransactionStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getPublicClient } from '../../../../packages/blockchain/src/getPublicClient';
import { waitForDecentTransactionSettlement } from '../../../../packages/blockchain/src/waitForDecentTransactionSettlement';

export type TxResponse = Pick<PendingNftTransaction, 'id' | 'sourceChainTxHash' | 'destinationChainTxHash' | 'status'>;

export async function getPendingNftTransactions(userId?: string) {
  if (!userId) {
    return [];
  }

  const response = await prisma.pendingNftTransaction.findMany({
    where: {
      userId,
      status: {
        in: ['pending', 'processing']
      }
    }
  });

  const txHashes = response.map<Promise<TxResponse>>(async (pendingTx) => {
    const tx =
      pendingTx.destinationChainId === pendingTx.sourceChainId
        ? await getPublicClient(pendingTx.destinationChainId)
            .waitForTransactionReceipt({
              hash: pendingTx.sourceChainTxHash as `0x${string}`
            })
            .then((_tx) => ({
              id: pendingTx.id,
              status: 'completed' as TransactionStatus,
              sourceChainTxHash: pendingTx.sourceChainTxHash,
              destinationChainTxHash: _tx.transactionHash
            }))
            .catch(() => ({
              id: pendingTx.id,
              status: 'failed' as TransactionStatus,
              sourceChainTxHash: pendingTx.sourceChainTxHash,
              destinationChainTxHash: pendingTx.destinationChainTxHash
            }))
        : await waitForDecentTransactionSettlement({
            sourceTxHash: pendingTx.sourceChainTxHash.toLowerCase(),
            sourceTxHashChainId: pendingTx.sourceChainId
          })
            .then((_tx) => ({
              id: pendingTx.id,
              status: 'completed' as TransactionStatus,
              sourceChainTxHash: pendingTx.sourceChainTxHash,
              destinationChainTxHash: _tx
            }))
            .catch(() => ({
              id: pendingTx.id,
              status: 'failed' as TransactionStatus,
              sourceChainTxHash: pendingTx.sourceChainTxHash,
              destinationChainTxHash: pendingTx.destinationChainTxHash
            }));

    return tx;
  });

  const txHashesResolved = await Promise.all(txHashes);

  return txHashesResolved;
}
