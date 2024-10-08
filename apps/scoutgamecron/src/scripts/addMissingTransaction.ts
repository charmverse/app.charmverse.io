
import { optimismUsdcContractAddress, realOptimismMainnetBuildersContract } from '@packages/scoutgame/builderNfts/constants'
import { handlePendingTransaction } from '@packages/scoutgame/builderNfts/handlePendingTransaction';
import { savePendingTransaction } from '@packages/scoutgame/savePendingTransaction'

async function addAndHandleMissingTransaction() {
  const tx = await savePendingTransaction({
    user: {
      scoutId: 'b9a5b3ac-a67b-4c3b-b1d5-ee59edda3e07',
      walletAddress: '0x5CF92EFDEb3964C7D5474e2fBA28E72b00463A38'
    },
    transactionInfo: {
      destinationChainId: 10,
      sourceChainId: 10,
      sourceChainTxHash: '0x6216fd6c8829b808e8f14f42bde482c639871e8640470d53d7ae58503927bfeb'
    },
    purchaseInfo: {
      quotedPriceCurrency: optimismUsdcContractAddress,
      builderContractAddress: realOptimismMainnetBuildersContract,
      tokenId: 97,
      quotedPrice: 6000000,
      tokenAmount: 1
    }
  });

  await handlePendingTransaction({ pendingTransactionId: tx.id });
}

addAndHandleMissingTransaction().then(console.log)