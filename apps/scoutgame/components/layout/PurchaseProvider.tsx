'use client';

import { log } from '@charmverse/core/log';
import {
  builderNftChain,
  getBuilderContractAddress,
  optimismUsdcContractAddress
} from '@packages/scoutgame/builderNfts/constants';
import { useAction } from 'next-safe-action/hooks';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import type { Address } from 'viem';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';

import { useGetPendingNftTransactions } from 'hooks/api/session';
import { checkDecentTransactionAction } from 'lib/builderNFTs/checkDecentTransactionAction';
import { saveDecentTransactionAction } from 'lib/builderNFTs/saveDecentTransactionAction';
import type { TxResponse } from 'lib/session/getPendingNftTransactions';

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
    sourceChainId: number;
    builderTokenId: number;
    purchaseCost: number;
    tokensToBuy: number;
  };
};

type PurchaseContext = {
  isExecutingTransaction: boolean;
  transactionHasSucceeded: boolean;
  checkDecentTransaction: (input: { pendingTransactionId: string; txHash: string }) => Promise<any>;
  error: string;
  sendNftMintTransaction: (input: MintTransactionInput) => Promise<unknown>;
};

export const PurchaseContext = createContext<Readonly<PurchaseContext | null>>(null);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { showMessage } = useSnackbar();
  const { refreshUser } = useUser();
  const { sendTransaction } = useSendTransaction();

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
      log.error('Error checking Decent transaction', { error, input });
      showMessage(error.serverError?.message || 'Something went wrong', 'error');
    }
  });

  const { executeAsync: saveDecentTransaction } = useAction(saveDecentTransactionAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        await checkDecentTransaction({ pendingTransactionId: res.data.id, txHash: res.data.txHash });
        await refreshUser();
        log.info('NFT minted', {
          chainId: res.data.input.transactionInfo.sourceChainId,
          builderTokenId: res.data.input.purchaseInfo.tokenId,
          purchaseCost: res.data.input.purchaseInfo.quotedPrice
        });
      } else {
        log.warn('NFT minted but no transaction id returned', {
          chainId: res.data?.input.transactionInfo.sourceChainId,
          builderTokenId: res.data?.input.purchaseInfo.tokenId,
          purchaseCost: res.data?.input.purchaseInfo.quotedPrice,
          responseData: res.data
        });
      }
    },
    onError({ error, input }) {
      log.error('Error minting NFT', { chainId: input.transactionInfo.sourceChainId, input, error });
      throw error;
    }
  });

  // useGetPendingNftTransactions(!isExecutingTransaction, undefined, {
  //   onSuccess(txs: TxResponse[]) {
  //     for (const tx of txs) {
  //       if (tx.status === 'completed') {
  //         showMessage(`Transaction ${tx.destinationChainTxHash} was successful`, 'success');
  //       } else if (tx.status === 'failed') {
  //         showMessage(`Transaction ${tx.destinationChainTxHash} failed`, 'error');
  //       }
  //     }

  //     refreshUser();
  //   }
  // });

  const sendNftMintTransaction = useCallback(
    async (input: MintTransactionInput) => {
      return new Promise((resolve, reject) => {
        const {
          txData: { to, data, value: _txValue },
          txMetadata: { sourceChainId, builderTokenId, purchaseCost, tokensToBuy, fromAddress }
        } = input;
        sendTransaction(
          {
            to,
            data,
            value: _txValue
          },
          {
            onSuccess: async (_data) => {
              log.info('Successfully sent mint transaction', { data: _data });
              await saveDecentTransaction({
                user: {
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
                  builderContractAddress: getBuilderContractAddress(),
                  tokenId: Number(builderTokenId),
                  quotedPriceCurrency: optimismUsdcContractAddress
                }
              });

              resolve(null);
            },
            onError: (err: any) => {
              log.error('Creating a mint transaction failed', {
                txData: input.txData,
                txMetadata: input.txMetadata,
                error: err
              });
              reject(err);
            }
          }
        );
      });
    },
    [sendTransaction]
  );

  const value = useMemo(
    () => ({
      isExecutingTransaction,
      transactionHasSucceeded,
      checkDecentTransaction,
      error: transactionResult.serverError?.message || 'Something went wrong',
      sendNftMintTransaction
    }),
    [
      isExecutingTransaction,
      transactionHasSucceeded,
      checkDecentTransaction,
      transactionResult.serverError?.message,
      sendNftMintTransaction
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
