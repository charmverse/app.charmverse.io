'use client';

import { log } from '@charmverse/core/log';
import { useAction } from 'next-safe-action/hooks';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { checkDecentTransactionAction } from 'lib/builderNFTs/checkDecentTransactionAction';

import { useSnackbar } from './SnackbarContext';

type PurchaseContext = {
  isExecutingTransaction: boolean;
  transactionHasSucceeded: boolean;
  checkDecentTransaction: (input: { pendingTransactionId: string }) => Promise<any>;
  error: string;
};

export const PurchaseContext = createContext<Readonly<PurchaseContext | null>>(null);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [pendingTransactionId, setPendingTransactionId] = useLocalStorage('pendingTransactionId', '');
  const { showMessage } = useSnackbar();

  const {
    isExecuting: isExecutingTransaction,
    hasSucceeded: transactionHasSucceeded,
    result: transactionResult,
    executeAsync: checkDecentTransaction
  } = useAction(checkDecentTransactionAction, {
    onExecute({ input }) {
      setPendingTransactionId(input.pendingTransactionId);
    },
    onSuccess({ input }) {
      showMessage(`Transaction ${input.pendingTransactionId} was successful`, 'success');
      setPendingTransactionId('');
    },
    onError({ error, input }) {
      log.error('Error checking Decent transaction', { error, input });
      showMessage(error.serverError?.message || 'Something went wrong', 'error');
      setPendingTransactionId('');
    }
  });

  useEffect(() => {
    // If the user refreshes the page we still want to show him the result of the transaction
    if (pendingTransactionId && !isExecutingTransaction) {
      checkDecentTransaction({ pendingTransactionId });
    }
  }, [pendingTransactionId, isExecutingTransaction]);

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
