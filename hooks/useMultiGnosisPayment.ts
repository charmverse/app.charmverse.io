import { SystemError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { getChainById } from '@packages/connectors/chains';
import { isTruthy } from '@packages/lib/utils/types';
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { ethers } from 'ethers';
import { getAddress } from 'viem';

import { useWeb3Account } from 'hooks/useWeb3Account';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { isMantleChain, proposeMantleSafeTransaction } from 'lib/gnosis/mantleClient';

import { useCreateSafes } from './useCreateSafes';

export type MetaTransactionDataWithApplicationId = MetaTransactionData & { applicationId: string };

export type GnosisProposeTransactionResult = {
  safeAddress: string;
  transactions: MetaTransactionDataWithApplicationId[];
  txHash: string;
};

export type GnosisPaymentProps = {
  chainId?: number;
  onSuccess: (results: GnosisProposeTransactionResult) => void;
  safeAddress: string;
  transactionPromises: Promise<MetaTransactionDataWithApplicationId | null>[];
  onError?: (error: SystemError) => void;
};

export function useMultiGnosisPayment({
  onError,
  chainId,
  safeAddress,
  transactionPromises,
  onSuccess
}: GnosisPaymentProps) {
  const { account, chainId: connectedChainId, signer } = useWeb3Account();
  const [safe] = useCreateSafes([safeAddress]);
  const network = chainId ? getChainById(chainId) : null;
  if (chainId && !network?.gnosisUrl) {
    throw new Error(`Unsupported Gnosis network: ${chainId}`);
  }

  async function makePayment() {
    if (chainId && chainId !== connectedChainId) {
      await switchActiveNetwork(chainId);
    }

    if (!safe || !account || !network?.gnosisUrl || !signer || !chainId) {
      return;
    }

    // Increment tx Nonce
    const nonce = await safe.getNonce();
    const { getSafeApiClient } = await import('lib/gnosis/safe/getSafeApiClient');

    const client = await getSafeApiClient({ chainId });

    const pendingTx = await client.getPendingTransactions(safeAddress);

    const txNonce = nonce + pendingTx.results.length;

    const transactionsWithRecipients = (await Promise.all(transactionPromises)).filter(isTruthy);

    if (transactionsWithRecipients.length === 0) {
      onError?.(
        new SystemError({
          errorType: 'External service',
          severity: 'error',
          message: 'No valid recipients found'
        })
      );
      return;
    }

    const safeTransaction = await safe.createTransaction({
      safeTransactionData: transactionsWithRecipients.map((transaction) => ({
        data: transaction.data,
        to: transaction.to,
        value: transaction.value,
        operation: transaction.operation
      })),
      options: {
        nonce: txNonce
      }
    });

    const EthersAdapter = (await import('@safe-global/safe-ethers-lib')).default;
    const SafeServiceClient = (await import('@safe-global/safe-service-client')).default;

    const txHash = await safe.getTransactionHash(safeTransaction);
    const senderSignature = await safe.signTransactionHash(txHash);
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    });

    const senderAddress = getAddress(account);

    const safeService = new SafeServiceClient({ txServiceUrl: network.gnosisUrl, ethAdapter });
    if (isMantleChain(chainId)) {
      await proposeMantleSafeTransaction({
        safeTransactionData: {
          ...safeTransaction.data,
          // Need to convert to string because mantle doesn't support big numbers
          // @ts-ignore
          baseGas: safeTransaction.data.baseGas.toString(),
          // @ts-ignore
          gasPrice: safeTransaction.data.gasPrice.toString(),
          // @ts-ignore
          nonce: safeTransaction.data.nonce.toString(),
          // @ts-ignore
          safeTxGas: safeTransaction.data.safeTxGas.toString()
        },
        txHash,
        senderAddress,
        safeAddress,
        signature: senderSignature.data,
        chainId
      });
    } else {
      await safeService.proposeTransaction({
        safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash: txHash,
        senderAddress,
        senderSignature: senderSignature.data,
        origin
      });
    }

    onSuccess({
      safeAddress,
      transactions: transactionsWithRecipients,
      txHash
    });
  }

  async function makePaymentWithErrorParser() {
    try {
      await makePayment();
    } catch (error) {
      log.error(error);
      // Use utilities for standard error message, but ensure downstream consumers don't think tx succeeded
      const { message, level } = getPaymentErrorMessage(error);
      throw new SystemError({
        errorType: 'External service',
        severity: level,
        message
      });
    }
  }

  return {
    safe,
    makePayment: makePaymentWithErrorParser
  };
}

export function getPaymentErrorMessage(error: any): { message: string; level: 'error' | 'warning' } {
  const errorMessage = extractWalletErrorMessage(error);

  if (errorMessage.toLowerCase().includes('underlying network changed')) {
    return {
      message: "You've changed your active network.\r\nRe-select 'Send payment' to complete this transaction",
      level: 'warning'
    };
  }

  return { message: errorMessage, level: 'error' };
}

function extractWalletErrorMessage(error: any): string {
  if (error?.code === 'INSUFFICIENT_FUNDS') {
    return 'You do not have sufficient funds to perform this transaction';
  } else if (error?.code === 4001) {
    return 'You rejected the transaction';
  } else if (error?.code === -32602) {
    return 'A valid recipient must be provided';
  } else if (error?.reason) {
    return error.reason;
  } else if (error?.data?.message) {
    return error.data.message;
  } else if (error?.message) {
    return error.message;
  } else if (typeof error === 'object') {
    return JSON.stringify(error);
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'An unknown error occurred';
  }
}
