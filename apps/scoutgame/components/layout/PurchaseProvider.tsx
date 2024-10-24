'use client';

import { log } from '@charmverse/core/log';
import { useAction } from 'next-safe-action/hooks';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useGetPendingNftTransactions } from 'hooks/api/session';
import { checkDecentTransactionAction } from 'lib/builderNFTs/checkDecentTransactionAction';
import type { TxResponse } from 'lib/session/getPendingNftTransactions';

import { useSnackbar } from './SnackbarContext';
import { useUser } from './UserProvider';

type PurchaseContext = {
  isExecutingTransaction: boolean;
  transactionHasSucceeded: boolean;
  checkDecentTransaction: (input: { pendingTransactionId: string; txHash: string }) => Promise<any>;
  error: string;
};

export const PurchaseContext = createContext<Readonly<PurchaseContext | null>>(null);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { showMessage } = useSnackbar();
  const { refreshUser } = useUser();

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

  useGetPendingNftTransactions(!isExecutingTransaction, undefined, {
    onSuccess(txs: TxResponse[]) {
      for (const tx of txs) {
        if (tx.status === 'completed') {
          showMessage(`Transaction ${tx.destinationChainTxHash} was successful`, 'success');
        } else if (tx.status === 'failed') {
          showMessage(`Transaction ${tx.destinationChainTxHash} failed`, 'error');
        }
      }

      refreshUser();
    }
  });

  const value = useMemo(
    () => ({
      isExecutingTransaction,
      transactionHasSucceeded,
      checkDecentTransaction,
      error: transactionResult.serverError?.message || 'Something went wrong'
    }),
    [isExecutingTransaction, transactionHasSucceeded, checkDecentTransaction, transactionResult.serverError?.message]
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
