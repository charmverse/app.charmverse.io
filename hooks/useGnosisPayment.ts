import { log } from '@charmverse/core/log';
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import SafeServiceClient from '@safe-global/safe-service-client';
import { getChainById } from 'connectors';
import { ethers } from 'ethers';
import { getAddress } from 'viem';

import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { proposeTransaction } from 'lib/gnosis/mantleClient';

import useGnosisSafes from './useGnosisSafes';

export type MultiPaymentResult = {
  safeAddress: string;
  transactions: (MetaTransactionData & { applicationId: string })[];
  txHash: string;
};

export type GnosisPaymentProps = {
  chainId?: number;
  onSuccess: (result: MultiPaymentResult) => void;
  safeAddress: string;
  transactions: (MetaTransactionData & { applicationId: string })[];
};

export function useGnosisPayment({ chainId, safeAddress, transactions, onSuccess }: GnosisPaymentProps) {
  const { account, chainId: connectedChainId, signer } = useWeb3Account();
  const { showMessage } = useSnackbar();
  const [safe] = useGnosisSafes([safeAddress]);
  const network = chainId ? getChainById(chainId) : null;
  if (chainId && !network?.gnosisUrl) {
    throw new Error(`Unsupported Gnosis network: ${chainId}`);
  }

  async function makePayment() {
    if (chainId && chainId !== connectedChainId) {
      await switchActiveNetwork(chainId);
    }

    if (!safe || !account || !network?.gnosisUrl || !signer) {
      return;
    }

    const safeTransaction = await safe.createTransaction({
      safeTransactionData: transactions.map((transaction) => ({
        data: transaction.data,
        to: transaction.to,
        value: transaction.value,
        operation: transaction.operation
      }))
    });

    const txHash = await safe.getTransactionHash(safeTransaction);
    const senderSignature = await safe.signTransactionHash(txHash);
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    });

    const senderAddress = getAddress(account);

    const safeService = new SafeServiceClient({ txServiceUrl: network.gnosisUrl, ethAdapter });
    if (chainId === 5001 || chainId === 5000) {
      await proposeTransaction({
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
    onSuccess({ safeAddress, transactions, txHash });
  }

  async function makePaymentGraceful() {
    try {
      await makePayment();
    } catch (error) {
      log.error(error);
      const { message, level } = getPaymentErrorMessage(error);
      showMessage(message, level);
    }
  }

  return {
    safe,
    makePayment: makePaymentGraceful
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
