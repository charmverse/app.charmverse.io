import { TransactionStatus, prisma } from '@charmverse/core/prisma-client';
import { realOptimismMainnetBuildersContract } from '@packages/scoutgame/builderNfts/constants';
import { handlePendingTransaction } from '@packages/scoutgame/builderNfts/handlePendingTransaction';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';

export async function processNftMints() {
  const pending = await prisma.pendingNftTransaction.findMany({
    where: {
      status: TransactionStatus.pending,
      contractAddress: realOptimismMainnetBuildersContract, // based on the season
      createdAt: {
        // Only process transactions that are at least 1 minute old in the case user is already in the app
        lte: new Date(Date.now() - 1000 * 65) // 65 seconds ago
      }
    }
  });

  const totalPendingTxs = pending.length;

  scoutgameMintsLogger.info(`Found ${totalPendingTxs} mint transactions to process`, {
    tx: pending.map((tx) => ({
      createdAt: tx.createdAt,
      sourceChainTxHash: tx.sourceChainTxHash,
      id: tx.id
    }))
  });

  for (let i = 0; i < totalPendingTxs; i++) {
    const pendingTx = pending[i];

    try {
      scoutgameMintsLogger.info(`Processing ${i + 1}/${totalPendingTxs} pending txs`, {
        pendingTransactionId: pendingTx.id,
        builderId: pendingTx.tokenId,
        sourceChainTxHash: pendingTx.sourceChainTxHash,
        scoutId: pendingTx.userId
      });
      await handlePendingTransaction({ pendingTransactionId: pendingTx.id });

      scoutgameMintsLogger.info(`Processed ${i + 1}/${totalPendingTxs} pending txs`);
    } catch (error) {
      scoutgameMintsLogger.warn(`Error processing pending tx`, { pendingTransactionId: pendingTx.id, error });
    }
  }
}
