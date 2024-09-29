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
    settlementTokenContractAdress: string;
    tokenContractAddress: string;
    tokenAmount: number;
    tokenId: number;
    quotedPriceForTokenAmount: number;
    quotedPriceCurrency: string;
  };
  userId: string;
};

export async function savePendingTransaction(data: PendingNftTransactionToSave) {
  await prisma.pendingNftTransaction.create({
    data: {
      userId: data.userId,
      senderAddress: data.user.walletAddress,
      sourceChainId: data.transactionInfo.sourceChainId,
      sourceChainTxHash: data.transactionInfo.sourceChainTxHash,
      destinationChainId: data.transactionInfo.destinationChainId,
      contractAddress: data.purchaseInfo.tokenContractAddress,
      tokenAmount: data.purchaseInfo.tokenAmount,
      tokenId: data.purchaseInfo.tokenId,
      targetAmountReceived: data.purchaseInfo.quotedPriceForTokenAmount,
      targetCurrencyContractAddress: data.purchaseInfo.settlementTokenContractAdress
    }
  });
}
