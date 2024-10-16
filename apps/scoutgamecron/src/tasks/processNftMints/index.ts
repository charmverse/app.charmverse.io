import { log } from '@charmverse/core/log';
import { TransactionStatus, prisma } from '@charmverse/core/prisma-client';
import { realOptimismMainnetBuildersContract } from '@packages/scoutgame/builderNfts/constants';
import { handlePendingTransaction } from '@packages/scoutgame/builderNfts/handlePendingTransaction';

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

  log.info(`Found ${totalPendingTxs} mint transactions to process`, {
    tx: pending.map((tx) => ({
      createdAt: tx.createdAt,
      sourceChainTxHash: tx.sourceChainTxHash,
      id: tx.id
    }))
  });

  for (let i = 0; i < totalPendingTxs; i++) {
    const pendingTx = pending[i];

    try {
      await handlePendingTransaction({ pendingTransactionId: pendingTx.id });

      log.info(`Processed ${i + 1}/${totalPendingTxs} pending txs`);
    } catch (error) {
      log.warn(`Error processing pending tx`, { pendingTransactionId: pendingTx.id, error });
    }
  }
}
