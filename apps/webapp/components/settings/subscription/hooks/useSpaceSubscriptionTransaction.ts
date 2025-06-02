import { log } from '@charmverse/core/log';
import type { Address } from 'viem';
import { parseUnits } from 'viem';
import { useSendTransaction, useWalletClient } from 'wagmi';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';

import { useTransferDevToken } from './useTransferDevToken';

type SpaceTransactionInput = {
  txData: {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  };
  txMetadata: {
    fromAddress: Address;
    decentChainId: number;
    spaceId: string;
    amount: number;
  };
};

type SendDevTransactionInput = {
  spaceId: string;
  amount: number;
  fromAddress: Address;
};

export function useSpaceSubscriptionTransaction() {
  const { sendTransactionAsync } = useSendTransaction();
  const { data: walletClient } = useWalletClient();
  const { showMessage } = useSnackbar();
  const { transferDevToken } = useTransferDevToken();

  async function sendDevTransaction(input: SendDevTransactionInput) {
    const { spaceId, amount, fromAddress } = input;

    if (!walletClient) {
      throw new Error('Wallet client not found');
    }

    try {
      const result = await transferDevToken(amount);
      if (!result) return;

      const transferredAmount = parseUnits(amount.toString(), 18);

      await charmClient.subscription.recordSubscriptionContribution(spaceId, {
        hash: result.hash,
        walletAddress: fromAddress,
        paidTokenAmount: transferredAmount.toString()
      });

      showMessage('DEV tokens sent successfully', 'success');
      return { success: true, txHash: result.hash };
    } catch (error) {
      log.error('Error sending DEV transaction', { error, spaceId, amount, fromAddress });
      throw error;
    }
  }

  async function sendOtherTokenTransaction(input: SpaceTransactionInput) {
    if (!walletClient) {
      throw new Error('Wallet client not found');
    }

    const {
      txData: { to, data, value },
      txMetadata: { decentChainId, spaceId, amount, fromAddress }
    } = input;

    try {
      const transferredAmount = parseUnits(amount.toString(), 18);

      const txHash = await sendTransactionAsync({
        to,
        data,
        value
      });

      showMessage('Transaction is being processed...', 'info');

      const result = await charmClient.subscription.recordSubscriptionContribution(spaceId, {
        hash: txHash,
        walletAddress: fromAddress,
        decentChainId,
        decentPayload: {
          to,
          data,
          value: value.toString()
        },
        paidTokenAmount: transferredAmount.toString()
      });

      if (result) {
        showMessage('Payment sent successfully', 'success');
        return { success: true, txHash };
      }
    } catch (error) {
      log.error('Error sending token transaction', {
        error,
        spaceId,
        amount,
        fromAddress,
        decentChainId
      });
      throw error;
    }
  }

  return {
    sendDevTransaction,
    sendOtherTokenTransaction
  };
}
