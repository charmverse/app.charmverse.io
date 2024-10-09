
import { prisma } from '@charmverse/core/prisma-client';
import { optimismUsdcContractAddress, realOptimismMainnetBuildersContract } from '@packages/scoutgame/builderNfts/constants'
import { handlePendingTransaction } from '@packages/scoutgame/builderNfts/handlePendingTransaction';
import { savePendingTransaction } from '@packages/scoutgame/savePendingTransaction'
import { getOnchainPurchaseEvents } from '@packages/scoutgame/builderNfts/getOnchainPurchaseEvents'
import {getTokenPurchasePrice} from '@packages/scoutgame/builderNfts/getTokenPurchasePrice';
import { prettyPrint } from '@packages/utils/strings';

async function syncUserNFTsFromOnchainData({username, scoutId}: {username?: string, scoutId?: string}): Promise<void> {
  if (!username && !scoutId) {
    throw new Error('Either username or scoutId must be provided');
  } else if (username && scoutId) {
    throw new Error('Only one of username or scoutId can be provided');
  }

  const scout = await prisma.scout.findFirstOrThrow({
    where: {
      id: scoutId,
      username
    }
  });

  const userPurchases = await getOnchainPurchaseEvents({ scoutId: scout.id });

  const txRequiringReconciliation = userPurchases.filter(p => !p.nftPurchase);

  for (let i = 0; i < txRequiringReconciliation.length; i++) {
    const tx = txRequiringReconciliation[i];
    const expectedPrice = await getTokenPurchasePrice({
      args: {
        amount: BigInt(tx.amount),
        tokenId: BigInt(tx.tokenId)
      },
      blockNumber: BigInt(tx.blockNumber) - BigInt(1)
    });

    const pendingTx = await savePendingTransaction({
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
        quotedPrice: Number(expectedPrice.toString),
        tokenAmount: Number(tx.amount)
      }
    });
  
    await handlePendingTransaction({ pendingTransactionId: pendingTx.id });
  }
}

// addAndHandleMissingTransaction().then(console.log)


syncUserNFTsFromOnchainData({ username: 'facel11' }).then(console.log)