'use client';

import { log } from '@charmverse/core/log';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import type { CreateSubscriptionContributionRequest } from '@root/lib/subscription/createSubscriptionContribution';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import useSWRMutation from 'swr/mutation';
import type { Address } from 'viem';
import { erc20Abi } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

type DirectTransactionInput = {
  tokenAmount: bigint;
  tokenAddress: Address;
  tier: SpaceSubscriptionTier;
};

type SubscriptionContributionContext = {
  isExecutingTransaction: boolean;
  error?: string;
  sendDirectTransaction: (input: DirectTransactionInput) => Promise<unknown>;
};

export const SubscriptionContributionContext = createContext<Readonly<SubscriptionContributionContext | null>>(null);

export function SubscriptionContributionProvider({ children }: { children: ReactNode }) {
  const { data: walletClient } = useWalletClient();
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { address } = useAccount();

  const {
    error: checkSubscriptionContributionError,
    isMutating: isCheckingSubscriptionContribution,
    trigger: checkSubscriptionContribution
  } = useSWRMutation(
    space ? `/spaces/${space.id}/subscription-contribution` : null,
    (_url, { arg }: Readonly<{ arg: { contributionId: string } }>) =>
      space ? charmClient.subscription.checkSubscriptionContribution(space.id, arg) : Promise.resolve(),
    {
      onError({ error, input }) {
        log.error(`Error checking subscription contribution`, { error, input });
      }
    }
  );
  const {
    error: saveSubscriptionPaymentError,
    isMutating: isSavingSubscriptionPayment,
    trigger: saveSubscriptionPayment
  } = useSWRMutation<{ contributionId: string }, any, string | null, CreateSubscriptionContributionRequest>(
    space ? `/spaces/${space.id}/subscription-contribution` : null,
    (_url, { arg }) =>
      space
        ? charmClient.subscription.createSubscriptionContribution(space.id, arg)
        : Promise.resolve({ contributionId: '' }),
    {
      async onSuccess(data) {
        await checkSubscriptionContribution({ contributionId: data.contributionId });
        showMessage('Subscription payment saved successfully', 'success');
      },
      onError({ error, input }) {
        showMessage('Error saving subscription contribution', 'error');
        log.error(`Error saving subscription contribution`, { error, input });
      }
    }
  );

  const sendDirectTransaction = useCallback(
    async (input: DirectTransactionInput) => {
      const { tokenAmount, tokenAddress } = input;

      if (!walletClient) {
        throw new Error('Wallet client not found');
      }

      if (!address) {
        throw new Error('Wallet address not found');
      }

      const txHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        // TODO: Add correct to address
        args: ['0x', tokenAmount]
      });
      await saveSubscriptionPayment({
        tier: input.tier,
        walletAddress: address,
        transactionInfo: {
          sourceChainId: 8453,
          sourceChainTxHash: txHash
        },
        paidTokenAmount: tokenAmount.toString()
      });
    },
    [saveSubscriptionPayment, walletClient]
  );

  const isExecutingTransaction = isSavingSubscriptionPayment || isCheckingSubscriptionContribution;

  const value = useMemo(
    () => ({
      isExecutingTransaction,
      error: saveSubscriptionPaymentError || checkSubscriptionContributionError,
      sendDirectTransaction
    }),
    [isExecutingTransaction, saveSubscriptionPaymentError, checkSubscriptionContributionError, sendDirectTransaction]
  );

  return <SubscriptionContributionContext.Provider value={value}>{children}</SubscriptionContributionContext.Provider>;
}

export function useSubscriptionContribution() {
  const context = useContext(SubscriptionContributionContext);

  if (!context) {
    throw new Error('useSubscriptionContribution must be used within a SubscriptionContributionProvider');
  }

  return context;
}
