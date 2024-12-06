'use client';

import { checkDecentTransactionAction } from '@packages/scoutgame/builderNfts/checkDecentTransactionAction';
import {
  builderNftChain,
  getBuilderContractAddress,
  optimismUsdcContractAddress
} from '@packages/scoutgame/builderNfts/constants';
import { saveDecentTransactionAction } from '@packages/scoutgame/builderNfts/saveDecentTransactionAction';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { useAction } from 'next-safe-action/hooks';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Address } from 'viem';
import { useSendTransaction } from 'wagmi';

import { useRefreshShareImage } from '../hooks/api/builders';

import { useSnackbar } from './SnackbarContext';
import { useUser } from './UserProvider';

type MintTransactionInput = {
  txData: {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  };
  txMetadata: {
    fromAddress: Address;
    contractAddress: Address;
    sourceChainId: number;
    builderTokenId: number;
    builderId: string;
    purchaseCost: number;
    tokensToBuy: number;
  };
};

type PurchaseContext = {
  isExecutingTransaction: boolean;
  isSavingDecentTransaction: boolean;
  savedDecentTransaction: boolean;
  transactionHasSucceeded: boolean;
  checkDecentTransaction: (input: { pendingTransactionId: string; txHash: string }) => Promise<any>;
  purchaseError?: string;
  sendNftMintTransaction: (input: MintTransactionInput) => Promise<unknown>;
  clearPurchaseSuccess: () => void;
  purchaseSuccess: boolean;
};

export const PurchaseContext = createContext<Readonly<PurchaseContext | null>>(null);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { showMessage } = useSnackbar();
  const { trigger: refreshShareImage } = useRefreshShareImage();
  const { refreshUser } = useUser();
  const { sendTransactionAsync } = useSendTransaction();

  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const {
    isExecuting: isExecutingTransaction,
    hasSucceeded: transactionHasSucceeded,
    result: transactionResult,
    executeAsync: checkDecentTransaction
  } = useAction(checkDecentTransactionAction, {
    onSuccess({ input }) {
      showMessage(`Transaction ${input.txHash || ''} was successful`, 'success');
    },
    onError({ error, input }) {
      scoutgameMintsLogger.error(`Error checking Decent transaction`, { error, input });
      showMessage(error.serverError?.message || 'Something went wrong', 'error');
    }
  });

  const {
    executeAsync: saveDecentTransaction,
    isExecuting: isSavingDecentTransaction,
    hasSucceeded: savedDecentTransaction,
    result: saveTransactionResult
  } = useAction(saveDecentTransactionAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        // Refresh the congrats image without awaiting it since we don't want to slow down the process
        refreshShareImage({ builderId: res.input.user.id });

        const checkResult = await checkDecentTransaction({
          pendingTransactionId: res.data.id,
          txHash: res.data.txHash
        });
        await refreshUser();

        if (checkResult?.serverError) {
          scoutgameMintsLogger.error(`Error checking decent.xyz for transaction`, {
            chainId: res.input.transactionInfo.sourceChainId,
            builderTokenId: res.input.purchaseInfo.tokenId,
            purchaseCost: res.input.purchaseInfo.quotedPrice
          });
        } else if (checkResult?.data?.success) {
          scoutgameMintsLogger.info(`NFT minted`, {
            chainId: res.input.transactionInfo.sourceChainId,
            builderTokenId: res.input.purchaseInfo.tokenId,
            purchaseCost: res.input.purchaseInfo.quotedPrice
          });
        }
      } else {
        scoutgameMintsLogger.warn(`NFT minted but no transaction id returned`, {
          chainId: res.input.transactionInfo.sourceChainId,
          builderTokenId: res.input.purchaseInfo.tokenId,
          purchaseCost: res.input.purchaseInfo.quotedPrice,
          responseData: res.data
        });
      }
    },
    onError({ error, input }) {
      scoutgameMintsLogger.error(`Error saving Decent NFT transaction`, {
        chainId: input.transactionInfo.sourceChainId,
        input,
        error
      });
    }
  });

  const sendNftMintTransaction = useCallback(
    async (input: MintTransactionInput) => {
      const {
        txData: { to, data, value: _txValue },
        txMetadata: {
          sourceChainId,
          builderTokenId,
          purchaseCost,
          tokensToBuy,
          fromAddress,
          builderId,
          contractAddress
        }
      } = input;
      return sendTransactionAsync(
        {
          to,
          data,
          value: _txValue
        },
        {
          onSuccess: async (_data) => {
            setPurchaseSuccess(true);
            const output = await saveDecentTransaction({
              user: {
                id: builderId,
                walletAddress: fromAddress
              },
              transactionInfo: {
                destinationChainId: builderNftChain.id,
                sourceChainId,
                sourceChainTxHash: _data
              },
              purchaseInfo: {
                quotedPrice: Number(purchaseCost),
                tokenAmount: tokensToBuy,
                builderContractAddress: contractAddress,
                tokenId: Number(builderTokenId),
                quotedPriceCurrency: optimismUsdcContractAddress
              }
            });

            if (output?.serverError) {
              scoutgameMintsLogger.error(`Saving mint transaction failed`, {});
            } else {
              scoutgameMintsLogger.info(`Successfully sent mint transaction`, { data: _data });
            }
          },
          onError: (err: any) => {
            scoutgameMintsLogger.error(`Creating a mint transaction failed`, {
              txData: input.txData,
              txMetadata: input.txMetadata,
              error: err
            });
          }
        }
      );
    },
    [sendTransactionAsync, saveDecentTransaction]
  );

  const clearPurchaseSuccess = useCallback(() => {
    setPurchaseSuccess(false);
  }, [setPurchaseSuccess]);

  const purchaseError =
    !isExecutingTransaction && !isSavingDecentTransaction
      ? transactionResult.serverError?.message || saveTransactionResult.serverError?.message
      : undefined;

  const value = useMemo(
    () => ({
      isExecutingTransaction,
      transactionHasSucceeded,
      checkDecentTransaction,
      purchaseError,
      sendNftMintTransaction,
      savedDecentTransaction,
      isSavingDecentTransaction,
      clearPurchaseSuccess,
      purchaseSuccess
    }),
    [
      isExecutingTransaction,
      transactionHasSucceeded,
      checkDecentTransaction,
      sendNftMintTransaction,
      savedDecentTransaction,
      isSavingDecentTransaction,
      purchaseError,
      clearPurchaseSuccess,
      purchaseSuccess
    ]
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchase() {
  const context = useContext(PurchaseContext);

  if (!context) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }

  return context;
}
