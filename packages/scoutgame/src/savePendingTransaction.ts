import { prisma } from '@charmverse/core/prisma-client';

type PendingNftTransactionToSave = {
  user: {
    scoutId: string;
    walletAddress: string;
  };
  transactionInfo: {
    sourceChainId: number;
    sourceChainTxHash: string;
    destinationChainId: number;
  };
  purchaseInfo: {
    builderContractAddress: string;
    tokenAmount: number;
    tokenId: number;
    quotedPrice: number;
    quotedPriceCurrency: string;
  };
};

export async function savePendingTransaction(data: PendingNftTransactionToSave) {
  return prisma.pendingNftTransaction.create({
    data: {
      userId: data.user.scoutId,
      senderAddress: data.user.walletAddress.toLowerCase(),
      sourceChainId: data.transactionInfo.sourceChainId,
      sourceChainTxHash: data.transactionInfo.sourceChainTxHash.toLowerCase(),
      destinationChainId: data.transactionInfo.destinationChainId,
      contractAddress: data.purchaseInfo.builderContractAddress.toLowerCase(),
      tokenAmount: data.purchaseInfo.tokenAmount,
      tokenId: data.purchaseInfo.tokenId,
      targetAmountReceived: data.purchaseInfo.quotedPrice,
      targetCurrencyContractAddress: data.purchaseInfo.quotedPriceCurrency.toLowerCase(),
      status: 'pending'
    }
  });
}
