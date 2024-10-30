import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

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
    }
  });

  const userPurchases = await getOnchainPurchaseEvents({ scoutId: scout.id, fromBlock });

  const txRequiringReconciliation = userPurchases.filter((p) => !p.nftPurchase);

  for (let i = 0; i < txRequiringReconciliation.length; i++) {
    log.info(`Processing missing tx ${i + 1} / ${txRequiringReconciliation.length}`);

    const tx = txRequiringReconciliation[i];
    const expectedPrice =
      tx.pendingTransaction?.targetAmountReceived ??
      (await getTokenPurchasePrice({
        args: {
          amount: BigInt(tx.amount),
          tokenId: BigInt(tx.tokenId)
        },
        blockNumber: BigInt(tx.blockNumber) - BigInt(1)
      }));

    const pendingTx =
      tx.pendingTransaction ??
      (await savePendingTransaction({
        user: {
          scoutId: scout.id,
          walletAddress: tx.transferEvent.to
        },
        transactionInfo: {
          destinationChainId: 10,
          sourceChainId: 10,
          sourceChainTxHash: tx.txHash
        },
        purchaseInfo: {
          quotedPriceCurrency: optimismUsdcContractAddress,
          builderContractAddress: realOptimismMainnetBuildersContract,
          tokenId: parseInt(tx.tokenId),
          quotedPrice: Number(expectedPrice.toString()),
          tokenAmount: Number(tx.amount)
        }
      }));

    await handlePendingTransaction({ pendingTransactionId: pendingTx.id });
  }
}
