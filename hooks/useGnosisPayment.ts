import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import SafeServiceClient from '@safe-global/safe-service-client';
import { getChainById } from 'connectors';
import { ethers, utils } from 'ethers';
import log from 'loglevel';

import type { MultiPaymentResult } from 'components/bounties/components/MultiPaymentButton';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';

import useGnosisSafes from './useGnosisSafes';

export type GnosisPaymentProps = {
  chainId?: number;
  onSuccess: (result: MultiPaymentResult) => void;
  safeAddress: string;
  transactions: (MetaTransactionData & { applicationId: string })[];
};

export function useGnosisPayment({ chainId, safeAddress, transactions, onSuccess }: GnosisPaymentProps) {
  const { account, chainId: connectedChainId, library } = useWeb3AuthSig();

  const [safe] = useGnosisSafes([safeAddress]);
  const network = chainId ? getChainById(chainId) : null;
  if (chainId && !network?.gnosisUrl) {
    throw new Error(`Unsupported Gnosis network: ${chainId}`);
  }

  async function makePayment() {
    if (chainId && chainId !== connectedChainId) {
      await switchActiveNetwork(chainId);
    }

    if (!safe || !account || !network?.gnosisUrl) {
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

    try {
      const txHash = await safe.getTransactionHash(safeTransaction);
      const senderSignature = await safe.signTransactionHash(txHash);
      const signer = await library.getSigner(account);
      const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: signer
      });

      const safeService = new SafeServiceClient({ txServiceUrl: network.gnosisUrl, ethAdapter });
      await safeService.proposeTransaction({
        safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash: txHash,
        senderAddress: utils.getAddress(account),
        senderSignature: senderSignature.data,
        origin
      });
      onSuccess({ safeAddress, transactions, txHash });
    } catch (e: any) {
      log.error(e);

      throw new Error(e);
    }
  }

  return {
    safe,
    makePayment
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
